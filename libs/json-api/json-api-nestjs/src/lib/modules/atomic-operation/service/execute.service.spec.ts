import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { KEY_MAIN_INPUT_SCHEMA } from '@klerick/json-api-nestjs-shared';
import { ExecuteService, isZodError } from './execute.service';
import { IterateFactory } from '../factory';
import {
  ASYNC_ITERATOR_FACTORY,
  MAP_CONTROLLER_INTERCEPTORS,
} from '../constants';

import {
  HttpException,
  NotFoundException,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ParamsForExecute } from '../types';
import { AsyncLocalStorage } from 'async_hooks';
import { RUN_IN_TRANSACTION_FUNCTION } from '../../../constants';
import { Mock } from 'vitest';
import { ErrorFormatService } from '../../mixin/service';

describe('ExecuteService', () => {
  let service: ExecuteService;
  let runInTransaction:  Mock;
  let moduleRef: ModuleRef;
  let asyncIteratorFactory: IterateFactory;
  const mapControllerInterceptors = new Map();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteService,
        {
          provide: RUN_IN_TRANSACTION_FUNCTION,
          useValue: vi.fn(),
        },
        {
          provide: ModuleRef,
          useValue: {
            get: () => void 0,
          },
        },
        {
          provide: ASYNC_ITERATOR_FACTORY,
          useValue: {
            createIterator: () => void 0,
          },
        },
        {
          provide: MAP_CONTROLLER_INTERCEPTORS,
          useValue: mapControllerInterceptors,
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

    service = module.get<ExecuteService>(ExecuteService);
    runInTransaction = module.get<Mock>(RUN_IN_TRANSACTION_FUNCTION);
    moduleRef = module.get<ModuleRef>(ModuleRef);
    asyncIteratorFactory = module.get<IterateFactory>(ASYNC_ITERATOR_FACTORY);
    mapControllerInterceptors.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run', () => {
    it('should throw NotFoundException if controller not found', async () => {
      const params = [
        {
          controller: { name: 'NonExistentController' },
          module: { controllers: new Map() },
        },
      ] as ParamsForExecute[];

      runInTransaction.mockImplementationOnce((args: () => {}) => args());

      vi.spyOn(service as any, 'executeOperations').mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(service.run(params, [])).rejects.toThrow(NotFoundException);

      expect(runInTransaction).toHaveBeenCalled();
    });

    it('should return an empty array if no operations are executed', async () => {
      const params: ParamsForExecute[] = [];

      runInTransaction.mockImplementationOnce((args: () => {}) => args());
      vi.spyOn(service as any, 'executeOperations').mockReturnValue([]);

      const result = await service.run(params, []);
      expect(result).toEqual([]);
      expect(runInTransaction).toHaveBeenCalled();
    });
  });

  describe('executeOperations', () => {
    it('should correctly execute operations', async () => {
      const params: ParamsForExecute[] = [
        {
          controller: { name: 'TestController' },
          methodName: 'someMethod',
          module: {}
        },
      ] as unknown as ParamsForExecute[];
      const callback = vi.fn().mockReturnValue({ value: 'test' });
      const mapController = {
        someMethod: callback,
      };
      vi
        .spyOn(service as any, 'getControllerInstance')
        .mockReturnValue(mapController);

      mapControllerInterceptors.set(mapController, new Map([[callback, []]]));
      let callCount = 0;
      vi.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
        [Symbol.asyncIterator]: () =>
          ({
            next: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ value: 'test', done: false });
              } else {
                return Promise.resolve({ value: undefined, done: true });
              }
            },
          } as any),
      });

      const result = await (service as any).executeOperations(params, []);

      expect(result).toEqual([{ value: 'test' }]);
    });

    it('should return an empty array if controller method does not return an object', async () => {
      const params: ParamsForExecute[] = [
        {
          controller: { name: 'TestController' },
          methodName: 'someMethod',
          module: {}
        },
      ] as unknown as ParamsForExecute[];

      const callback = vi.fn().mockReturnValue('not an object');
      const mapController = {
        someMethod: callback,
      };
      vi
        .spyOn(service as any, 'getControllerInstance')
        .mockReturnValue(mapController);

      mapControllerInterceptors.set(mapController, new Map([[callback, []]]));

      let callCount = 0;
      vi.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
        [Symbol.asyncIterator]: () =>
          ({
            next: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ value: 'not an object', done: false });
              } else {
                return Promise.resolve({ value: undefined, done: true });
              }
            },
          } as any),
      });

      const result = await (service as any).executeOperations(params, []);

      expect(result).toEqual([]);
    });

    it('should correctly assign lids to add operations using separate counter', async () => {
      const lids = ['lid-book-1', 'lid-book-2'];

      const params: ParamsForExecute[] = [
        {
          controller: { name: 'BookController' },
          methodName: 'postOne', // add operation - должна получить lids[0]
          module: {}
        },
        {
          controller: { name: 'UserController' },
          methodName: 'patchOne', // update operation - не должна получить lid
          module: {}
        },
        {
          controller: { name: 'BookController' },
          methodName: 'postOne', // add operation - должна получить lids[1]
          module: {}
        },
      ] as unknown as ParamsForExecute[];

      const bookCallback = vi.fn();
      const userCallback = vi.fn();

      bookCallback.mockReturnValueOnce({
        data: { id: 'real-book-id-1', attributes: {} }
      });

      userCallback.mockReturnValueOnce({
        data: { id: 'user-id', attributes: {} }
      });

      bookCallback.mockReturnValueOnce({
        data: { id: 'real-book-id-2', attributes: {} }
      });

      const bookController = { postOne: bookCallback };
      const userController = { patchOne: userCallback };

      let controllerCallCount = 0;
      vi.spyOn(service as any, 'getControllerInstance')
        .mockImplementation(() => {
          controllerCallCount++;
          if (controllerCallCount === 1 || controllerCallCount === 3) {
            return bookController;
          } else {
            return userController;
          }
        });

      mapControllerInterceptors.set(bookController, new Map([[bookCallback, []]]));
      mapControllerInterceptors.set(userController, new Map([[userCallback, []]]));

      let iteratorCallCount = 0;
      vi.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
        [Symbol.asyncIterator]: () => ({
          next: () => {
            iteratorCallCount++;
            if (iteratorCallCount <= 3) {
              // Возвращаем массив параметров для каждой операции
              return Promise.resolve({
                value: [{ attributes: {} }],
                done: false
              });
            } else {
              return Promise.resolve({ value: undefined, done: true });
            }
          },
        } as any),
      });

      const result = await (service as any).executeOperations(params, lids);

      expect(result).toHaveLength(3);
      expect(bookCallback).toHaveBeenCalledTimes(2);
      expect(userCallback).toHaveBeenCalledTimes(1);

      const firstCallArgs = bookCallback.mock.calls[0];
      expect(firstCallArgs[0]).toHaveProperty('id', 'lid-book-1');

      const secondCallArgs = bookCallback.mock.calls[1];
      expect(secondCallArgs[0]).toHaveProperty('id', 'lid-book-2');

      expect(result[0].data.id).toBe('real-book-id-1');
      expect(result[2].data.id).toBe('real-book-id-2');
    });

    it('should call processException if an exception is thrown during execution', async () => {
      const params: ParamsForExecute[] = [
        {
          controller: { name: 'TestController' },
          methodName: 'someMethod',
          module: {}
        },
      ] as unknown as ParamsForExecute[];

      const callback = vi.fn().mockImplementation(() => {
        throw new HttpException('Test exception', 400);
      });
      const mapController = {
        someMethod: callback,
      };
      vi
        .spyOn(service as any, 'getControllerInstance')
        .mockReturnValue(mapController);

      mapControllerInterceptors.set(mapController, new Map([[callback, []]]));

      let callCount = 0;
      vi.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
        [Symbol.asyncIterator]: () =>
          ({
            next: () => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({ value: 'test', done: false });
              } else {
                return Promise.resolve({ value: undefined, done: true });
              }
            },
          } as any),
      });

      const processExceptionSpy = vi.spyOn(
        service as any,
        'processException'
      );

      await expect((service as any).executeOperations(params)).rejects.toThrow(
        HttpException
      );

      expect(processExceptionSpy).toHaveBeenCalled();
    });
  });

  describe('getControllerInstance', () => {
    it('should throw NotFoundException if controller not found', () => {
      const params: ParamsForExecute = {
        controller: { name: 'NonExistentController' },
        module: { controllers: new Map() },
      } as unknown as ParamsForExecute;

      expect(() => (service as any).getControllerInstance(params)).toThrow(
        NotFoundException
      );
    });

    it('should return controller instance if controller is found', () => {
      const controllerInstance = {
        someMethod: vi.fn().mockReturnValue('test'),
      };
      function TestController() {}
      const params: ParamsForExecute = {
        controller: TestController,
        methodName: 'someMethod',
        module: {
          controllers: new Map([
            [TestController, { instance: controllerInstance }],
          ]),
        },
      } as unknown as ParamsForExecute;

      const result = (service as any).getControllerInstance(params);

      expect(result).toBe(controllerInstance);
    });
  });

  describe('processException', () => {
    it('should rethrow HttpException with modified response if ZodError is thrown', () => {
      const exception = new HttpException(
        {
          message: [{ path: ['test'] }],
        },
        400
      );

      try {
        (service as any).processException(exception, 1);
      } catch (e) {
        if (e instanceof HttpException) {
          const response = e.getResponse();
          if (isZodError(response)) {
            expect(response['message'][0]['path']).toEqual([
              KEY_MAIN_INPUT_SCHEMA,
              '1',
              'test',
            ]);
          } else {
            assert.fail('Exception response is not a ZodError');
          }
        } else {
          assert.fail('Caught exception is not a HttpException');
        }
      }
    });

    it('should rethrow the original exception if it is not a HttpException', () => {
      const exception = new Error('Test exception');

      expect(() => (service as any).processException(exception, 1)).toThrow(
        Error
      );
    });
  });

  describe('runOneOperation', () => {
    it('should correctly run operation', async () => {
      const controllerInstance = {
        someMethod: vi.fn().mockReturnValue('test'),
      };
      function TestController() {}
      const pipes = [
        { index: 0, pipes: [] },
        { index: 1, pipes: [] },
      ];
      const params: ParamsForExecute = {
        controller: TestController,
        methodName: 'someMethod',
        module: {
          controllers: new Map([
            [TestController, { instance: controllerInstance }],
          ]),
        },
        params: ['param1', 'param2'],
      } as unknown as ParamsForExecute;

      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        { 0: pipes[0], 1: pipes[1] },
        TestController,
        'someMethod'
      );

      const runPipesSpy = vi
        .spyOn(service as any, 'runPipes')
        .mockImplementation((param) => `modified_${param}`);

      await (service as any).runOneOperation(params);

      expect(runPipesSpy).toHaveBeenCalledWith(
        'param1',
        params.module,
        pipes[0].pipes
      );
      expect(runPipesSpy).toHaveBeenCalledWith(
        'param2',
        params.module,
        pipes[1].pipes
      );
    });

    it('should not call runPipes if metadata is empty', async () => {
      const controllerInstance = {
        someMethod: vi.fn().mockReturnValue('test'),
      };
      function TestController() {}
      const params: ParamsForExecute = {
        controller: TestController,
        methodName: 'someMethod',
        module: {
          controllers: new Map([
            [TestController, { instance: controllerInstance }],
          ]),
        },
        params: ['param1', 'param2'],
      } as unknown as ParamsForExecute;

      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        {},
        TestController,
        'someMethod'
      );

      const runPipesSpy = vi
        .spyOn(service as any, 'runPipes')
        .mockImplementation((param) => `modified_${param}`);

      await (service as any).runOneOperation(params);

      expect(runPipesSpy).not.toHaveBeenCalled();
    });
  });

  describe('runPipes', () => {
    it('should correctly run pipes', async () => {
      const value = 'test';
      const pipes = [new ParseBoolPipe(), new ParseIntPipe()];
      const module = {} as any;

      vi
        .spyOn(pipes[0], 'transform')
        // @ts-ignore
        .mockImplementation((val) => `validated_${val}`);

      vi
        .spyOn(pipes[1], 'transform')
        // @ts-ignore
        .mockImplementation((val) => `parsed_${val}`);
      const getPipeInstanceSpy = vi
        .spyOn(service as any, 'getPipeInstance')
        .mockImplementation((pipe) =>
          pipe instanceof ParseBoolPipe ? pipes[0] : pipes[1]
        );

      const result = await (service as any).runPipes(value, module, [
        pipes[0],
        pipes[1],
      ]);

      expect(result).toBe('parsed_validated_test');
      expect(getPipeInstanceSpy).toHaveBeenCalledTimes(2);
      expect(getPipeInstanceSpy).toHaveBeenNthCalledWith(1, pipes[0], module);
      expect(getPipeInstanceSpy).toHaveBeenNthCalledWith(2, pipes[1], module);
    });

    it('should not call getPipeInstance if pipes array is empty', async () => {
      const value = 'test';
      const module = {} as any;

      const getPipeInstanceSpy = vi.spyOn(service as any, 'getPipeInstance');

      const result = await (service as any).runPipes(value, module, []);

      expect(result).toBe('test');
      expect(getPipeInstanceSpy).not.toHaveBeenCalled();
    });
  });

  describe('getPipeInstance', () => {
    it('should return pipe instance from module if it exists', () => {
      const pipe = new ParseBoolPipe();
      const module = {
        getProviderByKey: vi.fn().mockReturnValue({ instance: pipe }),
      } as any;

      const result = (service as any).getPipeInstance(ParseBoolPipe, module);

      expect(result).toBe(pipe);
      expect(module.getProviderByKey).toHaveBeenCalledWith(ParseBoolPipe);
    });

    it('should return pipe instance from moduleRef if it does not exist in module', () => {
      const pipe = new ParseBoolPipe();
      const module = {
        getProviderByKey: vi.fn().mockReturnValue(null),
      } as any;
      vi.spyOn(service['moduleRef'], 'get').mockReturnValue(pipe);

      const result = (service as any).getPipeInstance(ParseBoolPipe, module);

      expect(result).toBe(pipe);
      expect(service['moduleRef'].get).toHaveBeenCalledWith(ParseBoolPipe, {
        strict: false,
      });
    });
  });

  describe('ExecuteService - replaceLids', () => {
    let service: ExecuteService;

    beforeEach(() => {
      service = new ExecuteService();
    });

    it('should be return id first input params of array is undefined', () => {
      const inputParams = [] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be return id first input params of array is string', () => {
      const inputParams = ['string'] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be return id first input params of array is number', () => {
      const inputParams = [1] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });
    it('should be return id first input params of array is array', () => {
      const inputParams = [[]] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be return id first input params of array is object', () => {
      const inputParams = [{}] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be return id first input params of array is object with undefined of relationships', () => {
      const inputParams = [{ relationships: undefined }] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be not replace of relation with object', () => {
      const inputParams = [
        {
          relationships: {
            addresses: { data: { id: '1234', type: 'addresses' } },
          },
        },
      ] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be not replace of relation with array of object', () => {
      const inputParams = [
        {
          relationships: {
            addresses: {
              data: [
                { id: '1234', type: 'addresses' },
                { id: '1235', type: 'addresses' },
              ],
            },
          },
        },
      ] as any;
      const lidsMap = {};

      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(inputParams);
    });

    it('should be replace of relation with object', () => {
      const inputParams = [
        {
          relationships: {
            addresses: { data: { id: '1234', type: 'addresses' } },
          },
        },
      ] as any;
      const newId = '4321';
      const lidsMap = { '1234': newId };

      const checkResult = [
        {
          ...inputParams[0],
          relationships: {
            ...inputParams[0].relationships,
            addresses: {
              ...inputParams[0].relationships.addresses,
              data: {
                ...inputParams[0].relationships.addresses.data,
                id: newId,
              },
            },
          },
        },
      ];
      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(checkResult);
    });

    it('should be replace of relation with array of object', () => {
      const inputParams = [
        {
          relationships: {
            addresses: {
              data: [
                { id: '12345', type: 'addresses' },
                { id: '1234', type: 'addresses' },
              ],
            },
          },
        },
      ] as any;
      const newId = '4321';
      const lidsMap = { '1234': newId };

      const checkResult = [
        {
          ...inputParams[0],
          relationships: {
            ...inputParams[0].relationships,
            addresses: {
              ...inputParams[0].relationships.addresses,
              data: [
                inputParams[0].relationships.addresses.data[0],
                {
                  ...inputParams[0].relationships.addresses.data[1],
                  id: newId,
                },
              ],
            },
          },
        },
      ];
      const result = service.replaceLids(inputParams, lidsMap);
      expect(result).toEqual(checkResult);
    });
  });
});
