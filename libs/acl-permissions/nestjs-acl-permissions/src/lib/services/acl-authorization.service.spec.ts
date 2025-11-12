import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.vitest';
import { ModuleRef } from '@nestjs/core';
import { AclAuthorizationService } from './acl-authorization.service';
import { ACL_CONTEXT_KEY, ACL_MODULE_OPTIONS } from '../constants';
import type { AclModuleOptions, AclRulesLoader } from '../types';
import { ABILITY_FACTORY } from '../factories';
import { assert, describe, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';

// Mock Logger to avoid actual logging in tests
const mockLoggerDebug = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('@nestjs/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/common')>();
  return {
    ...actual,
    Logger: class Logger {
      debug = mockLoggerDebug;
      warn = mockLoggerWarn;
      error = mockLoggerError;
    },
  };
});

describe('AclAuthorizationService', () => {
  let aclAuthorizationService: AclAuthorizationService;
  let moduleRef: Mocked<ModuleRef>;
  let mockOptions: AclModuleOptions;

  const controllerName = 'UsersController';
  const controllerMethod = 'getAll';
  const subject = class User {};

  const loadRulesMock = vi.fn();
  const getContextMock = vi.fn();
  const getHelpersMock = vi.fn();
  const canMock = vi.fn();
  // Mock contextStore
  const mockContextStore = {
    set: vi.fn(),
    get: vi.fn(),
  };
  const mockAbilityFactory = vi.fn().mockReturnValue({
    can: canMock,
  });
  // Mock rulesLoader
  const mockRulesLoader: AclRulesLoader = {
    loadRules: loadRulesMock,
    getContext: getContextMock,
    getHelpers: getHelpersMock,
  };

  // Mock ExecutionContext

  beforeEach(async () => {
    // Default module options
    mockOptions = {
      rulesLoader: 'RulesLoader' as any,
      contextStore: 'ContextStore' as any,
      onNoRules: 'deny',
      defaultRules: [],
    };

    const { unit, unitRef } = await TestBed.solitary(AclAuthorizationService)
      .mock(ACL_MODULE_OPTIONS)
      .impl(() => mockOptions)
      .mock(ABILITY_FACTORY)
      .impl(() => mockAbilityFactory)
      .compile();

    aclAuthorizationService = unit;
    // @ts-expect-error incorrect type
    moduleRef = unitRef.get(ModuleRef);

    // Setup default moduleRef behavior
    moduleRef.get.mockImplementation((token: any) => {
      if (token === mockOptions.rulesLoader) {
        return mockRulesLoader as any;
      }
      if (token === mockOptions.contextStore) {
        return mockContextStore as any;
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Use controller options', () => {
    it('Should be forbidden when no rules is not array and onNoRules=deny but global options is allow', async () => {
      mockOptions.onNoRules = 'allow';
      try {
        await aclAuthorizationService.authorize(
          controllerName,
          controllerMethod,
          {
            enabled: true,
            subject,
            methods: {
              [controllerMethod]: {
                onNoRules: 'deny',
              }
            },
          }
        );
        assert.fail('Should throw ForbiddenException');
      } catch (err) {
        expect(err).instanceof(ForbiddenException);
        expect(mockLoggerError).toBeCalledWith(
          `No ACL rules defined for ${controllerName}.${controllerMethod}, denying access (onNoRules: 'deny')`
        );
        expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
      }
    });
  })

  describe('Not use controller options', () => {
    it('Should be forbidden when no rules is not array and onNoRules=deny', async () => {
      try {
        await aclAuthorizationService.authorize(
          controllerName,
          controllerMethod,
          {
            enabled: true,
            subject,
            methods: {},
          }
        );
        assert.fail('Should throw ForbiddenException');
      } catch (err) {
        expect(err).instanceof(ForbiddenException);
        expect(mockLoggerError).toBeCalledWith(
          `No ACL rules defined for ${controllerName}.${controllerMethod}, denying access (onNoRules: 'deny')`
        );
        expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
      }
    });

    it('Should be forbidden when no rules is empty array and onNoRules=deny', async () => {
      loadRulesMock.mockResolvedValue([]);
      try {
        await aclAuthorizationService.authorize(
          controllerName,
          controllerMethod,
          {
            enabled: true,
            subject,
            methods: {},
          }
        );
        assert.fail('Should throw ForbiddenException');
      } catch (err) {
        expect(err).instanceof(ForbiddenException);
        expect(mockLoggerError).toBeCalledWith(
          `No ACL rules defined for ${controllerName}.${controllerMethod}, denying access (onNoRules: 'deny')`
        );
        expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
      }
    });

    it('Should be allowed when no rules is not array and onNoRules=allow', async () => {
      mockOptions.onNoRules = 'allow';
      canMock.mockReturnValue(true);
      loadRulesMock.mockResolvedValue([]);
      getContextMock.mockResolvedValue({});
      getHelpersMock.mockResolvedValue({});
      const result = await aclAuthorizationService.authorize(
        controllerName,
        controllerMethod,
        {
          enabled: true,
          subject,
          methods: {},
        }
      );

      expect(result).toBe(true);
      expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
      expect(mockLoggerWarn).toBeCalledWith(
        `No ACL rules defined for ${controllerName}.${controllerMethod}, allowing access with permissive rule (onNoRules: 'allow')`
      );
      expect(mockAbilityFactory).toBeCalledWith(
        subject.name,
        controllerMethod,
        [{ action: controllerMethod, subject: subject.name }],
        {},
        {}
      );
      expect(mockContextStore.set).toBeCalledWith(ACL_CONTEXT_KEY, mockAbilityFactory.mock.results[0].value);
    });

    it('Should be forbidden when rules not allow access', async () => {

      loadRulesMock.mockResolvedValue([{ action: 'getAll', subject: 'User', inverted: true }]);
      getContextMock.mockResolvedValue({});
      getHelpersMock.mockResolvedValue({});
      canMock.mockReturnValue(false);
      try {
        await aclAuthorizationService.authorize(
          controllerName,
          controllerMethod,
          {
            enabled: true,
            subject,
            methods: {},
          }
        )
        assert.fail('Should throw ForbiddenException');
      } catch (err) {
        expect(err).instanceof(ForbiddenException);
        expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
        expect(mockAbilityFactory).toBeCalledWith(
          subject.name,
          controllerMethod,
          await loadRulesMock.mock.results[0].value,
          {},
          {}
        );
      }
    })

    it('Should be forbidden when rules not allow access', async () => {

      loadRulesMock.mockResolvedValue([]);
      getContextMock.mockResolvedValue({});
      getHelpersMock.mockResolvedValue({});
      canMock.mockReturnValue(false);
      const defaultRules = [{ action: 'getAll', subject: 'User', inverted: true }];
      try {
        await aclAuthorizationService.authorize(
          controllerName,
          controllerMethod,
          {
            enabled: true,
            subject,
            methods: {
              [controllerMethod]: {
                defaultRules,
              }
            },
          }
        )
        assert.fail('Should throw ForbiddenException');
      } catch (err) {
        expect(err).instanceof(ForbiddenException);
        expect(loadRulesMock).toBeCalledWith(subject, controllerMethod);
        expect(mockAbilityFactory).toBeCalledWith(
          subject.name,
          controllerMethod,
          defaultRules,
          {},
          {}
        );
        expect(mockLoggerDebug).toBeCalledWith(
          `No rules for ${controllerName}.${controllerMethod}, applying defaultRules`
        );
      }
    })
  });
});
