import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import { Operation } from '@klerick/json-api-nestjs-shared';
import {
  MAP_ENTITY,
  MAP_CONTROLLER_ENTITY,
  MAP_CONTROLLER_INTERCEPTORS,
} from '../constants';

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
    it('should return the correct method name for given parameters: postRelationship', () => {
      expect(service.getMethodNameByParam(Operation.add, 'id', 'rel')).toBe(
        'postRelationship'
      );
    });
    it('should return the correct method name for given parameters: postOne', () => {
      expect(service.getMethodNameByParam(Operation.add, 'id')).toBe(
        'postOne'
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
      const requestBody = { data: data.data, meta: undefined };
      expect(service.getParamsForMethod('patchRelationship', data)).toEqual([
        data.ref.id,
        data.ref.relationship,
        requestBody,
        requestBody,
      ]);
    });

    it('should return the correct parameters with meta', () => {
      const data = {
        ref: {
          id: '1',
          relationship: 'belongs-to',
          type: 'TypeA',
        },
        op: Operation.add,
        data: {},
        meta: { source: 'import', batchId: '123' },
      };
      const requestBody = { data: data.data, meta: data.meta };
      expect(service.getParamsForMethod('patchRelationship', data)).toEqual([
        data.ref.id,
        data.ref.relationship,
        requestBody,
        requestBody,
      ]);
    });

    it('should return correct parameters for postOne without meta', () => {
      const data = {
        ref: {
          type: 'TypeA',
        },
        op: Operation.add,
        data: { attributes: { name: 'test' } },
      };
      const requestBody = { data: data.data, meta: undefined };
      expect(service.getParamsForMethod('postOne', data)).toEqual([
        requestBody,
        requestBody,
      ]);
    });

    it('should return correct parameters for postOne with meta', () => {
      const data = {
        ref: {
          type: 'TypeA',
        },
        op: Operation.add,
        data: { attributes: { name: 'test' } },
        meta: { priority: 'high' },
      };
      const requestBody = { data: data.data, meta: data.meta };
      expect(service.getParamsForMethod('postOne', data)).toEqual([
        requestBody,
        requestBody,
      ]);
    });

    it('should return correct parameters for deleteOne (no meta support)', () => {
      const data = {
        ref: {
          id: '1',
          type: 'TypeA',
        },
        op: Operation.remove,
      };
      expect(service.getParamsForMethod('deleteOne', data)).toEqual([
        data.ref.id,
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
