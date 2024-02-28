import {
  HttpException,
  NotFoundException,
  Inject,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Module } from '@nestjs/core/injector/module';
import { ArgumentMetadata } from '@nestjs/common/interfaces/features/pipe-transform.interface';
import { ModuleRef } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { ParamsForExecute } from '../types';
import { CURRENT_DATA_SOURCE_TOKEN } from '../../../constants';
import { ASYNC_ITERATOR_FACTORY, KEY_MAIN_INPUT_SCHEMA } from '../constants';
import { IterateFactory } from '../factory';
import {
  ResourceObject,
  ResourceObjectRelationships,
  TypeFromType,
  ValidateQueryError,
} from '../../../types';
import { ObjectTyped } from '../../../helper';

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

@Injectable()
export class ExecuteService {
  @Inject(CURRENT_DATA_SOURCE_TOKEN) private readonly dataSource!: DataSource;
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(ASYNC_ITERATOR_FACTORY) private asyncIteratorFactory!: IterateFactory<
    ExecuteService['runOneOperation']
  >;

  async run(params: ParamsForExecute[], tmpIds: (string | number)[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction('READ UNCOMMITTED');

    try {
      const resultArray = await this.executeOperations(params, tmpIds);
      await queryRunner.commitTransaction();
      return resultArray;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return [];
  }

  private async executeOperations(
    params: ParamsForExecute[],
    tmpIds: (string | number)[]
  ) {
    const iterateParams = this.asyncIteratorFactory.createIterator(
      params as Parameters<ExecuteService['runOneOperation']>,
      this.runOneOperation.bind(this) as ExecuteService['runOneOperation']
    );

    const resultArray: Array<
      ResourceObject<any> | ResourceObjectRelationships<any, any>
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

        // @ts-ignore
        const result = await controller[methodName](...itemReplace);

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

  private replaceTmpIds<T extends ParamsForExecute['params']>(
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

    if (!('relationships' in bodyInput)) {
      return inputParams;
    }

    const { relationships } = bodyInput;
    if (!relationships) {
      return inputParams;
    }

    bodyInput.relationships = ObjectTyped.entries(relationships).reduce(
      (acum, [name, val]) => {
        if (Array.isArray(val)) {
          acum[name] = (val as any[]).map((i) => {
            i['id'] = tmpIdsMap[i['id']] ? tmpIdsMap[i['id']] : i['id'];
            return i;
          }) as never;
        } else {
          acum[name]['id'] = tmpIdsMap[val['id']]
            ? (tmpIdsMap[val['id']] as never)
            : acum[name]['id'];
        }
        return acum;
      },
      { ...relationships }
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
    throw e;
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
