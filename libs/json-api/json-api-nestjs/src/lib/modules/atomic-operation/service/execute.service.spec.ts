import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { DataSource } from 'typeorm';
import { ExecuteService, isZodError } from './execute.service';
import { IterateFactory } from '../factory';
import { ASYNC_ITERATOR_FACTORY, KEY_MAIN_INPUT_SCHEMA } from '../constants';
import { CURRENT_DATA_SOURCE_TOKEN } from '../../../constants';
import {
  HttpException,
  NotFoundException,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ParamsForExecute } from '../types';

describe('ExecuteService', () => {
  let service: ExecuteService;
  let dataSource: DataSource;
  let moduleRef: ModuleRef;
  let asyncIteratorFactory: IterateFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteService,
        {
          provide: CURRENT_DATA_SOURCE_TOKEN,
          useValue: {
            createQueryRunner: () => {},
          },
        },
        {
          provide: ModuleRef,
          useValue: {
            get() {},
          },
        },
        {
          provide: ASYNC_ITERATOR_FACTORY,
          useValue: {
            createIterator: () => {},
          },
        },
      ],
    }).compile();

    service = module.get<ExecuteService>(ExecuteService);
    dataSource = module.get<DataSource>(CURRENT_DATA_SOURCE_TOKEN);
    moduleRef = module.get<ModuleRef>(ModuleRef);
    asyncIteratorFactory = module.get<IterateFactory>(ASYNC_ITERATOR_FACTORY);
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

      const queryRunnerMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'createQueryRunner')
        .mockReturnValue(queryRunnerMock as any);

      jest.spyOn(service as any, 'executeOperations').mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(service.run(params, [])).rejects.toThrow(NotFoundException);

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      await expect(service.run(params, [])).rejects.toThrow(NotFoundException);
    });

    it('should return an empty array if no operations are executed', async () => {
      const params: ParamsForExecute[] = [];

      const queryRunnerMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'createQueryRunner')
        .mockReturnValue(queryRunnerMock as any);

      jest.spyOn(service as any, 'executeOperations').mockReturnValue([]);

      const result = await service.run(params, []);
      expect(result).toEqual([]);

      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });

  describe('executeOperations', () => {
    it('should correctly execute operations', async () => {
      const params: ParamsForExecute[] = [
        {
          controller: { name: 'TestController' },
          methodName: 'someMethod',
        },
      ] as unknown as ParamsForExecute[];

      jest.spyOn(service as any, 'getControllerInstance').mockReturnValue({
        someMethod: jest.fn().mockReturnValue({ value: 'test' }),
      });
      let callCount = 0;
      jest.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
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
        },
      ] as unknown as ParamsForExecute[];

      jest.spyOn(service as any, 'getControllerInstance').mockReturnValue({
        someMethod: jest.fn().mockReturnValue('not an object'),
      });

      let callCount = 0;
      jest.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
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

    it('should call processException if an exception is thrown during execution', async () => {
      const params: ParamsForExecute[] = [
        {
          controller: { name: 'TestController' },
          methodName: 'someMethod',
        },
      ] as unknown as ParamsForExecute[];

      jest.spyOn(service as any, 'getControllerInstance').mockReturnValue({
        someMethod: jest.fn().mockImplementation(() => {
          throw new HttpException('Test exception', 400);
        }),
      });

      let callCount = 0;
      jest.spyOn(asyncIteratorFactory, 'createIterator').mockReturnValue({
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

      const processExceptionSpy = jest.spyOn(
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
        someMethod: jest.fn().mockReturnValue('test'),
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
            fail('Exception response is not a ZodError');
          }
        } else {
          fail('Caught exception is not a HttpException');
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
        someMethod: jest.fn().mockReturnValue('test'),
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

      const runPipesSpy = jest
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
        someMethod: jest.fn().mockReturnValue('test'),
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

      const runPipesSpy = jest
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

      jest
        .spyOn(pipes[0], 'transform')
        // @ts-ignore
        .mockImplementation((val) => `validated_${val}`);

      jest
        .spyOn(pipes[1], 'transform')
        // @ts-ignore
        .mockImplementation((val) => `parsed_${val}`);
      const getPipeInstanceSpy = jest
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

      const getPipeInstanceSpy = jest.spyOn(service as any, 'getPipeInstance');

      const result = await (service as any).runPipes(value, module, []);

      expect(result).toBe('test');
      expect(getPipeInstanceSpy).not.toHaveBeenCalled();
    });
  });

  describe('getPipeInstance', () => {
    it('should return pipe instance from module if it exists', () => {
      const pipe = new ParseBoolPipe();
      const module = {
        getProviderByKey: jest.fn().mockReturnValue({ instance: pipe }),
      } as any;

      const result = (service as any).getPipeInstance(ParseBoolPipe, module);

      expect(result).toBe(pipe);
      expect(module.getProviderByKey).toHaveBeenCalledWith(ParseBoolPipe);
    });

    it('should return pipe instance from moduleRef if it does not exist in module', () => {
      const pipe = new ParseBoolPipe();
      const module = {
        getProviderByKey: jest.fn().mockReturnValue(null),
      } as any;
      jest.spyOn(service['moduleRef'], 'get').mockReturnValue(pipe);

      const result = (service as any).getPipeInstance(ParseBoolPipe, module);

      expect(result).toBe(pipe);
      expect(service['moduleRef'].get).toHaveBeenCalledWith(ParseBoolPipe, {
        strict: false,
      });
    });
  });
});
