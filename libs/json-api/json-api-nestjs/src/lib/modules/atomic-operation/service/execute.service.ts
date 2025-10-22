import {
  HttpException,
  NotFoundException,
  Inject,
  Injectable,
  PipeTransform,
  Type,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  INTERCEPTORS_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { Module } from '@nestjs/core/injector/module';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';
import { ApplicationConfig, ModuleRef, NestContainer } from '@nestjs/core';
import {
  ObjectTyped,
  ResourceObject,
  ResourceObjectRelationships,
  KEY_MAIN_INPUT_SCHEMA,
} from '@klerick/json-api-nestjs-shared';
import {
  InterceptorsConsumer,
  InterceptorsContextCreator,
} from '@nestjs/core/interceptors';
import { Controller } from '@nestjs/common/interfaces';
import { lastValueFrom } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';

import { MapControllerInterceptor, ParamsForExecute } from '../types';
import {
  ASYNC_ITERATOR_FACTORY,
  MAP_CONTROLLER_INTERCEPTORS,
} from '../constants';
import { IterateFactory } from '../factory';
import { TypeFromType, ValidateQueryError } from '../../../types';
import { RunInTransaction } from '../../mixin/types';
import { RUN_IN_TRANSACTION_FUNCTION } from '../../../constants';
import { ErrorFormatService } from '../../mixin/service';

export function isZodError(
  param: string | unknown
): param is { message: ValidateQueryError[] } {
  return (
    param instanceof Object &&
    'message' in param &&
    Array.isArray(param.message) &&
    'path' in param.message[0]
  );
}

function assertIsArray(data: unknown): data is Array<any> {
  return Array.isArray(data);
}

@Injectable()
export class ExecuteService {
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef & {
    container: NestContainer;
    applicationConfig: ApplicationConfig;
    _moduleKey: string;
  };
  @Inject(ASYNC_ITERATOR_FACTORY) private asyncIteratorFactory!: IterateFactory<
    ExecuteService['runOneOperation']
  >;
  @Inject(RUN_IN_TRANSACTION_FUNCTION)
  private runInTransaction!: RunInTransaction<
    () => ReturnType<ExecuteService['executeOperations']>
  >;
  @Inject(MAP_CONTROLLER_INTERCEPTORS)
  private mapControllerInterceptor!: MapControllerInterceptor;

  @Inject(AsyncLocalStorage) private asyncLocalStorage!: AsyncLocalStorage<any>;
  @Inject(ErrorFormatService) private errorFormatService!: ErrorFormatService;

  private _interceptorsContextCreator!: InterceptorsContextCreator;

  get interceptorsContextCreator() {
    if (!this._interceptorsContextCreator) {
      this._interceptorsContextCreator = new InterceptorsContextCreator(
        this.moduleRef.container,
        this.moduleRef.applicationConfig
      );
    }

    return this._interceptorsContextCreator;
  }

  private interceptorsConsumer = new InterceptorsConsumer();

  async run(params: ParamsForExecute[], tmpIds: (string | number)[]) {
    return this.runInTransaction(() => this.executeOperations(params, tmpIds));
  }

  protected async executeOperations(
    params: ParamsForExecute[],
    tmpIds: (string | number)[] = []
  ) {
    const iterateParams = this.asyncIteratorFactory.createIterator(
      params as Parameters<ExecuteService['runOneOperation']>,
      this.runOneOperation.bind(this) as ExecuteService['runOneOperation']
    );

    const resultArray: Array<
      | ResourceObject<object>
      | ResourceObjectRelationships<object, string, keyof object>
    > = [];
    let i = 0;
    const tmpIdsMap: Record<string | number, string | number> = {};
    try {
      for await (const item of iterateParams) {
        const currentParams = params[i];
        const controller = this.getControllerInstance(currentParams);
        const methodName =
          currentParams.methodName as (typeof currentParams)['methodName'];

        const paramsForExecute = item as unknown as ParamsForExecute['params'];

        const itemReplace = this.replaceTmpIds(paramsForExecute, tmpIdsMap);
        const body = itemReplace.at(-1);
        // First operation doesn't have tmpId'
        const currentTmpId = i !== 0 ? tmpIds[i] : undefined;
        if (methodName === 'postOne' && currentTmpId && body) {
          if (typeof body === 'object' && 'attributes' in body) {
            body['id'] = `${currentTmpId}`;
            itemReplace[itemReplace.length - 1];
          }
        }

        const interceptors = this.getInterceptorsArray(
          controller,
          controller[methodName],
          currentParams.module
        );

        const result$: any = await this.interceptorsConsumer.intercept(
          interceptors,
          [
            ...Object.values(this.asyncLocalStorage.getStore() || {}),
            itemReplace,
          ],
          controller,
          // @ts-expect-error inccorect parse
          controller[methodName],
          // @ts-expect-error inccorect parse
          async () => controller[methodName](...itemReplace)
        );

        const result =
          interceptors.length === 0
            ? await result$
            : await lastValueFrom(result$);

        if (tmpIds[i] && result && !Array.isArray(result.data) && result.data) {
          tmpIdsMap[tmpIds[i]] = result.data.id;
        }

        if (result instanceof Object) {
          resultArray.push(result);
        }
        i++;
      }
    } catch (e) {
      this.processException(e, i);
    }
    return resultArray;
  }

  private getInterceptorsArray(
    controller: Controller,
    callback: (...arg: any) => any,
    module: ParamsForExecute['module']
  ) {
    let controllerFromMap = this.mapControllerInterceptor.get(controller);

    if (!controllerFromMap) {
      controllerFromMap = new Map();
      this.mapControllerInterceptor.set(controller, controllerFromMap);
    }

    const interceptorsFromMap = controllerFromMap.get(callback);

    if (interceptorsFromMap) {
      return interceptorsFromMap;
    }

    const interceptorsForController = this.interceptorsContextCreator.create(
      controller,
      callback,
      module.token
    );

    const interceptorsForMethode = new Set(
      Reflect.getMetadata(INTERCEPTORS_METADATA, callback) || []
    );

    const resultInterceptors = interceptorsForController.filter((i) =>
      interceptorsForMethode.has(i.constructor)
    );
    controllerFromMap.set(callback, resultInterceptors);
    return resultInterceptors;
  }

  replaceTmpIds<T extends ParamsForExecute['params']>(
    inputParams: T,
    tmpIdsMap: Record<string | number, string | number>
  ): T {
    const bodyInput = inputParams.at(-1);
    if (!bodyInput) {
      return inputParams;
    }
    if (typeof bodyInput === 'string') {
      return inputParams;
    }
    if (typeof bodyInput === 'number') {
      return inputParams;
    }

    if (Array.isArray(bodyInput)) {
      return inputParams;
    }

    if (!(typeof bodyInput === 'object' && 'relationships' in bodyInput)) {
      return inputParams;
    }

    const { relationships } = bodyInput;

    if (!relationships) {
      return inputParams;
    }

    bodyInput.relationships = ObjectTyped.entries(relationships).reduce(
      (acum, [name, val]) => {
        if (!val) throw new Error('Val undefined');
        const { data } = val as any;
        if (assertIsArray(data)) {
          acum[name] = {
            data: data.map((i) => {
              if (i === null) return i;
              return {
                ...i,
                id: tmpIdsMap[i['id']] ? `${tmpIdsMap[i['id']]}` : i['id'],
              };
            }),
          };
        } else {
          if (!data) {
            acum[name] = val;
          } else {
            data['id'] = tmpIdsMap[data['id']]
              ? `${tmpIdsMap[data['id']]}`
              : data['id'];
            acum[name] = {
              data,
            };
          }
        }
        return acum;
      },
      { ...relationships } as any
    );

    inputParams[inputParams.length - 1] = bodyInput;
    return inputParams;
  }

  private getControllerInstance(params: ParamsForExecute) {
    const controllerClass = params.controller;
    const controllerInstanceWrapper =
      params.module.controllers.get(controllerClass);

    if (!controllerInstanceWrapper) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        path: ['type'],
        message: `Controller "${controllerClass.name}" not found`,
      };
      throw new NotFoundException([error]);
    }

    return controllerInstanceWrapper.instance as TypeFromType<
      ParamsForExecute['controller']
    >;
  }

  private processException(e: any, i: number) {
    if (e instanceof HttpException) {
      const response = e.getResponse();
      if (isZodError(response)) {
        response['message'] = response['message'].map((m: any) => {
          m['path'] = [KEY_MAIN_INPUT_SCHEMA, `${i}`, ...m['path']];
          return m;
        });
      }
      throw new HttpException(response, e.getStatus());
    }
    const formatError = this.errorFormatService.formatError(e);

    if (formatError instanceof InternalServerErrorException) {
      throw formatError
    }
    const response = formatError.getResponse()
    if (typeof response === 'object' && 'message' in response && Array.isArray(response['message'])) {
      response['message'] = response['message'].map((m: any) => {
        m['path'] = [KEY_MAIN_INPUT_SCHEMA, `${i}`, ...m['path']];
        return m;
      });
      throw new HttpException(response, formatError.getStatus());
    }
    throw formatError;
  }

  private async runOneOperation(
    paramForExecute: ParamsForExecute
  ): Promise<ParamsForExecute['params']> {
    const { params, controller, methodName, module } = paramForExecute;
    const pramsPipe = Object.values(
      Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, methodName)
    ) as unknown as {
      index: number;
      pipes: Type<PipeTransform>[];
    }[];
    const resultParams = new Array(params.length);
    for (const { pipes, index } of pramsPipe) {
      resultParams[index] = await this.runPipes(params[index], module, pipes);
    }
    return resultParams as unknown as ParamsForExecute['params'];
  }

  private async runPipes(
    initialParams: unknown,
    module: Module,
    pipes: Type<PipeTransform>[]
  ) {
    let modifiedParams = initialParams;
    for (const pipe of pipes) {
      const pipeInstance = this.getPipeInstance(pipe, module);
      modifiedParams = await pipeInstance.transform(
        modifiedParams,
        {} as ArgumentMetadata
      );
    }
    return modifiedParams;
  }

  private getPipeInstance(
    pipe: Type<PipeTransform>,
    module: Module
  ): PipeTransform {
    const instanceWrapper = module.getProviderByKey<PipeTransform>(pipe);
    if (!instanceWrapper) {
      return this.moduleRef.get(pipe, { strict: false });
    }
    return instanceWrapper.instance;
  }
}
