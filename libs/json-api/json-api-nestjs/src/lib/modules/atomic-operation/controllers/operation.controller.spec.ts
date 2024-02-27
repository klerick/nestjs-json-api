import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryModule } from '@nestjs/core';
import { HttpException } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { IMemoryDb } from 'pg-mem';

import { OperationController } from './operation.controller';
import { ExecuteService, ExplorerService } from '../service';
import { InputArray, Operation } from '../utils';
import { JsonBaseController } from '../../../mixin/controller/json-base.controller';
import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  Users,
} from '../../../mock-utils';

import {
  ASYNC_ITERATOR_FACTORY,
  KEY_MAIN_OUTPUT_SCHEMA,
  MAP_CONTROLLER_ENTITY,
  MAP_ENTITY,
  ZOD_INPUT_OPERATION,
} from '../constants';

import { CurrentDataSourceProvider } from '../../../factory';
import { DEFAULT_CONNECTION_NAME } from '../../../constants';
import { OperationMethode } from '../types';

describe('OperationController', () => {
  let db: IMemoryDb;
  let operationController: OperationController;
  let explorerService: ExplorerService<Users>;
  let executeService: ExecuteService;

  beforeEach(async () => {
    db = createAndPullSchemaBase();
    const app: TestingModule = await Test.createTestingModule({
      imports: [DiscoveryModule, mockDBTestModule(db)],
      controllers: [OperationController],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        ExplorerService,
        ExecuteService,
        {
          provide: MAP_ENTITY,
          useValue: {},
        },
        {
          provide: MAP_CONTROLLER_ENTITY,
          useValue: {},
        },
        {
          provide: ASYNC_ITERATOR_FACTORY,
          useValue: {},
        },
        {
          provide: ZOD_INPUT_OPERATION,
          useValue: {},
        },
      ],
    }).compile();

    operationController = app.get<OperationController>(OperationController);
    explorerService = app.get<ExplorerService<Users>>(ExplorerService);
    executeService = app.get<ExecuteService>(ExecuteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('index', () => {
    it('should return the result of executeService.run', async () => {
      const inputArrayMock: InputArray = [
        {
          ref: {
            id: '1',
            relationship: 'belongs-to',
            type: 'TypeA',
          },
          op: Operation.add,
        },
      ];
      const paramsForExecuteMock = [
        {
          module: new (class Module {})() as Module,
          params: [1, 'nameRel', { type: 'name', id: '' }],
          methodName: 'patchOne',
          controller: JsonBaseController,
        },
      ];

      const mockReturnData = { data: { someData: '' } };

      const getControllerByEntityNameSpy = jest
        .spyOn(explorerService, 'getControllerByEntityName')
        .mockReturnValue(paramsForExecuteMock[0].controller);
      const getMethodNameByParamSpy = jest
        .spyOn(explorerService, 'getMethodNameByParam')
        .mockReturnValue(
          paramsForExecuteMock[0].methodName as OperationMethode
        );
      const getModulesByControllerSpy = jest
        .spyOn(explorerService, 'getParamsForMethod')
        .mockReturnValue(
          paramsForExecuteMock[0].params as Parameters<
            JsonBaseController<Users>['deleteOne']
          >
        );
      const getParamsForMethodSpy = jest
        .spyOn(explorerService, 'getModulesByController')
        .mockReturnValue(paramsForExecuteMock[0].module);
      const runSpy = jest
        .spyOn(executeService, 'run')
        .mockResolvedValue([mockReturnData] as never);

      expect(await operationController.index(inputArrayMock)).toEqual({
        [KEY_MAIN_OUTPUT_SCHEMA]: [mockReturnData],
      });

      expect(getControllerByEntityNameSpy).toHaveBeenCalledWith('TypeA');
      expect(getMethodNameByParamSpy).toHaveBeenCalledWith(
        inputArrayMock[0].op,
        inputArrayMock[0].ref.id,
        inputArrayMock[0].ref.relationship
      );
      expect(getModulesByControllerSpy).toHaveBeenCalledWith(
        paramsForExecuteMock[0].methodName,
        { op: inputArrayMock[0].op, ref: inputArrayMock[0].ref }
      );
      expect(getParamsForMethodSpy).toHaveBeenCalledWith(
        paramsForExecuteMock[0].controller
      );
      // expect(runSpy).toHaveBeenCalledWith(paramsForExecuteMock[0].module, paramsForExecuteMock[0].methodName, paramsForExecuteMock[0].params);

      expect(runSpy).toHaveBeenCalledWith(paramsForExecuteMock, []);
    });

    it('should throw NotFoundException when type does not exist', async () => {
      const inputArrayMock: any[] = [
        {
          ref: {
            id: '1',
            relationship: 'belongs-to',
            type: 'TypeA',
          },
          op: Operation.add,
        },
      ];

      jest
        .spyOn(explorerService, 'getControllerByEntityName')
        .mockImplementationOnce(() => {
          throw new HttpException('Resource does not exist', 404);
        });
      expect.assertions(1);
      try {
        await operationController.index(inputArrayMock as InputArray);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
      }
    });

    it('should throw MethodNotAllowedException when operation not allowed', async () => {
      const inputArrayMock = [
        {
          ref: {
            id: '1',
            relationship: 'belongs-to',
            type: 'TypeA',
          },
          op: Operation.add,
        },
      ];

      jest
        .spyOn(explorerService, 'getControllerByEntityName')
        .mockReturnValue(Promise.resolve({}) as any);

      jest
        .spyOn(explorerService, 'getMethodNameByParam')
        .mockImplementationOnce(() => {
          throw new HttpException('Operation not allowed', 405);
        });

      expect.assertions(1);
      try {
        await operationController.index(inputArrayMock as InputArray);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });
});
