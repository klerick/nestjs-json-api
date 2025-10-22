import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryModule } from '@nestjs/core';
import { HttpException } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import {
  KEY_MAIN_OUTPUT_SCHEMA,
  Operation,
} from '@klerick/json-api-nestjs-shared';

import { OperationController } from './operation.controller';
import { ExecuteService, ExplorerService } from '../service';
import { InputArray } from '../utils';
import { JsonBaseController } from '../../mixin/controllers';

import { Users } from '../../../utils/___test___/test-classes.helper';

import {
  ASYNC_ITERATOR_FACTORY,
  MAP_CONTROLLER_ENTITY,
  MAP_ENTITY,
  ZOD_INPUT_OPERATION,
  MAP_CONTROLLER_INTERCEPTORS,
} from '../constants';

import { OperationMethode } from '../types';
import { AsyncLocalStorage } from 'async_hooks';
import { RUN_IN_TRANSACTION_FUNCTION } from '../../../constants';
import { ErrorFormatService } from '@klerick/json-api-nestjs';

describe('OperationController', () => {
  let operationController: OperationController;
  let explorerService: ExplorerService<Users>;
  let executeService: ExecuteService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [DiscoveryModule],
      controllers: [OperationController],
      providers: [
        ExplorerService,
        ExecuteService,
        {
          provide: MAP_ENTITY,
          useValue: {},
        },
        {
          provide: RUN_IN_TRANSACTION_FUNCTION,
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
        {
          provide: MAP_CONTROLLER_INTERCEPTORS,
          useValue: {},
        },
        {
          provide: AsyncLocalStorage,
          useValue: new AsyncLocalStorage(),
        },
        {
          provide: ErrorFormatService,
          useValue: {}
        }
      ],
    }).compile();

    operationController = app.get<OperationController>(OperationController);
    explorerService = app.get<ExplorerService<Users>>(ExplorerService);
    executeService = app.get<ExecuteService>(ExecuteService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

      const getControllerByEntityNameSpy = vi
        .spyOn(explorerService, 'getControllerByEntityName')
        .mockReturnValue(paramsForExecuteMock[0].controller);
      const getMethodNameByParamSpy = vi
        .spyOn(explorerService, 'getMethodNameByParam')
        .mockReturnValue(
          paramsForExecuteMock[0].methodName as OperationMethode<object>
        );
      const getModulesByControllerSpy = vi
        .spyOn(explorerService, 'getParamsForMethod')
        .mockReturnValue(
          paramsForExecuteMock[0].params as Parameters<
            JsonBaseController<Users>['deleteOne']
          >
        );
      const getParamsForMethodSpy = vi
        .spyOn(explorerService, 'getModulesByController')
        .mockReturnValue(paramsForExecuteMock[0].module);
      const runSpy = vi
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

      vi
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

      vi
        .spyOn(explorerService, 'getControllerByEntityName')
        .mockReturnValue(Promise.resolve({}) as any);

      vi
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
