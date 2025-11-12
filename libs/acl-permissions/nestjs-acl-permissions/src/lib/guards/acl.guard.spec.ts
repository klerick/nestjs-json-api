import { TestBed } from '@suites/unit';
import { ModuleRef, Reflector } from '@nestjs/core';

import { AclGuard } from './acl.guard';
import { ExecutionContext } from '@nestjs/common';
import { expect, vi } from 'vitest';
import { Mocked } from '@suites/doubles.vitest';
import { AclAuthorizationService } from '../services';

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

const createMockExecutionContext = (
  controller: any,
  handler: any
): ExecutionContext =>
  ({
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: vi.fn(),
  } as unknown as ExecutionContext);

class UsersController {
  getAll() {
    void 0;
  }
  getOne() {
    void 0;
  }
  postOne() {
    void 0;
  }
  patchOne() {
    void 0;
  }
  deleteOne() {
    void 0;
  }
}

describe('AclGuard', () => {
  let aclGuard: AclGuard;
  let moduleRef: Mocked<ModuleRef>;
  let reflector: Mocked<Reflector>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(AclGuard).compile();
    // @ts-expect-error incorrect type
    moduleRef = unitRef.get(ModuleRef);
    reflector = unitRef.get(Reflector);
    aclGuard = unit;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Return true when metadata is empty', async () => {
    const executionContext = createMockExecutionContext(
      UsersController,
      UsersController.prototype.getAll
    );

    reflector.get.mockReturnValue(undefined);
    const result = await aclGuard.canActivate(executionContext);
    expect(result).toBe(true);
    expect(mockLoggerDebug).toBeCalledWith(
      `No @AclController metadata found on ${UsersController.name}, allowing access`
    );
    expect(moduleRef.get).not.toBeCalled();
  });

  it('Return true when metadata.enabled is false', async () => {
    const executionContext = createMockExecutionContext(
      UsersController,
      UsersController.prototype.getAll
    );

    reflector.get.mockReturnValue({ enabled: false });
    const result = await aclGuard.canActivate(executionContext);
    expect(result).toBe(true);
    expect(mockLoggerDebug).toBeCalledWith(
      `ACL disabled for controller ${UsersController.name}, allowing access`
    );
    expect(moduleRef.get).not.toBeCalled();
  });

  it('Return true when metadata.methods[methodName] is false', async () => {
    const executionContext = createMockExecutionContext(
      UsersController,
      UsersController.prototype.getAll
    );

    reflector.get.mockReturnValue({
      enabled: true,
      methods: { getAll: false },
    });
    const result = await aclGuard.canActivate(executionContext);
    expect(result).toBe(true);
    expect(mockLoggerDebug).toBeCalledWith(
      `ACL disabled for method ${UsersController.name}.${UsersController.prototype.getAll.name}, allowing access`
    );
    expect(moduleRef.get).not.toBeCalled();
  });

  it('Should be call moduleRef.get with AclAuthorizationService and call authorize ', async () => {
    const executionContext = createMockExecutionContext(
      UsersController,
      UsersController.prototype.getAll
    );
    const metaData = {
      enabled: true,
      methods: { getAll: true },
    };
    reflector.get.mockReturnValue(metaData);
    const authorizeSpy = vi.fn().mockResolvedValue(true);
    moduleRef.get.mockReturnValue({
      authorize: authorizeSpy,
    });

    const result = await aclGuard.canActivate(executionContext);
    expect(result).toBe(true);
    expect(moduleRef.get).toBeCalledWith(AclAuthorizationService, {
      strict: false,
    });
    expect(authorizeSpy).toBeCalledWith(
      UsersController.name,
      UsersController.prototype.getAll.name,
      metaData
    );
  });
});
