import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import {
  MAP_ENTITY,
  MAP_CONTROLLER_ENTITY,
  OPTIONS,
  MAP_CONTROLLER_INTERCEPTORS,
} from '../constants';
import { Operation } from '../utils';
import { ExplorerService } from './explorer.service';

describe('ExplorerService', () => {
  let service: ExplorerService;
  class EntityName {}
  class ControllerName {}
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExplorerService,
        {
          provide: ModulesContainer,
          useValue: new Map([
            [
              'TestModule',
              {
                controllers: new Map([['ControllerName', ControllerName]]),
              },
            ],
          ]),
        },
        {
          provide: MAP_ENTITY,
          useValue: new Map([['EntityName', EntityName]]),
        },
        {
          provide: MAP_CONTROLLER_ENTITY,
          useValue: new Map([[EntityName, ControllerName]]),
        },
        {
          provide: MAP_CONTROLLER_INTERCEPTORS,
          useValue: new Map(),
        },
        {
          provide: OPTIONS,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get<ExplorerService>(ExplorerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getControllerByEntityName()', () => {
    it('should return the correct controller for a given entity name', () => {
      expect(service.getControllerByEntityName('EntityName')).toBeDefined();
    });
  });

  describe('getMethodNameByParam()', () => {
    it('should return the correct method name for given parameters', () => {
      expect(service.getMethodNameByParam(Operation.add, 'id', 'rel')).toBe(
        'postRelationship'
      );
    });
  });

  describe('getParamsForMethod()', () => {
    it('should return the correct parameters for a given method name', () => {
      const data = {
        ref: {
          id: '1',
          relationship: 'belongs-to',
          type: 'TypeA',
        },
        op: Operation.add,
        data: {},
      };
      expect(service.getParamsForMethod('patchRelationship', data)).toEqual([
        data.ref.id,
        data.ref.relationship,
        { data: data.data },
      ]);
    });
  });

  describe('getModulesByController()', () => {
    it('should return the correct module for a given controller', () => {
      expect(
        service.getModulesByController(ControllerName as any)
      ).toBeDefined();
    });
  });
});
