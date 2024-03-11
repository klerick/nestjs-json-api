import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  ErrorCodeType,
  PayloadRpc,
  PayloadRpcArray,
  PayloadRpcData,
  RpcResult,
} from '../../../types';
import {
  createError,
  fromRpcErrorToRpcErrorObject,
  RpcError,
} from '../../../utils';
import {
  ASYNC_ITERATOR_FACTORY,
  JsonRpcMetadataKeyParamPipe,
  MAP_HANDLER,
} from '../../../constants';
import { IterateFactory } from '../../../providers';
import { RpcErrorObject } from '../../../types/error-payloade';

type toString<T> = T extends string ? T : never;

function isArrayData(data: PayloadRpcData): data is PayloadRpcArray {
  return Array.isArray(data);
}

function isTypeTransform(
  pipe: Type<PipeTransform> | PipeTransform
): pipe is PipeTransform {
  return !(typeof pipe === 'function' && /^\s*class\s+/.test(pipe.toString()));
}

function isMethod<T extends object>(
  handler: T,
  methodName: unknown
): methodName is keyof T {
  if (typeof methodName !== 'string') return false;
  const methode = Reflect.get(handler, methodName);
  return methode && typeof methode === 'function';
}

type CallBackReturnType = {
  pipe: PipeTransform | undefined;
  metatype: ArgumentMetadata;
  params: PayloadRpc['params'][number];
  index: number;
};

@Injectable()
export class HandlerService {
  @Inject(MAP_HANDLER) private readonly mapHandler!: Map<string, object>;
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(ASYNC_ITERATOR_FACTORY)
  private readonly asyncIterate!: IterateFactory<
    PayloadRpc['params'],
    (
      params: PayloadRpc['params'][number],
      index: number
    ) => Promise<CallBackReturnType>
  >;

  private mapInjectPipe: Map<Type<PipeTransform>, PipeTransform> = new Map<
    Type<PipeTransform>,
    PipeTransform
  >();

  public async runRpc(
    data: PayloadRpcData
  ): Promise<RpcResult | RpcErrorObject | Array<RpcResult | RpcErrorObject>> {
    if (isArrayData(data)) {
      const result: (RpcResult | RpcErrorObject)[] = [];
      for (const item of data) {
        const callRpcResult = await this.callRpc(item, item.id);
        result.push(callRpcResult);
      }
      return result;
    } else {
      return this.callRpc(data, 1);
    }
  }

  private async callRpc(
    rpcData: PayloadRpc,
    id: number
  ): Promise<RpcResult | RpcErrorObject> {
    try {
      const result = await this.callHandler(rpcData);
      return {
        ...result,
        id,
      };
    } catch (e) {
      if (e instanceof RpcError) {
        return fromRpcErrorToRpcErrorObject(e, id);
      }
      return fromRpcErrorToRpcErrorObject(
        createError(ErrorCodeType.ServerError, (e as Error).message),
        id
      );
    }
  }

  async callHandler(rpcData: PayloadRpc): Promise<RpcResult | never> {
    const handler = this.mapHandler.get(rpcData.method.spaceName);
    if (!handler) {
      throw createError(
        ErrorCodeType.MethodNotFound,
        `${rpcData.method.spaceName} not found`
      );
    }
    const methodName = rpcData.method.methodName;

    if (!isMethod(handler, methodName)) {
      throw createError(
        ErrorCodeType.MethodNotFound,
        `${rpcData.method.spaceName}.${rpcData.method.methodName} not found`
      );
    }

    const params = await this.getParamsForHandler(
      handler,
      methodName,
      rpcData.params
    );

    const result = await (
      handler[methodName] as (
        ...arg: PayloadRpc['params']
      ) => Promise<PayloadRpc['params']>
    )(...params);
    const { jsonrpc } = rpcData;

    return {
      jsonrpc,
      result,
      id: null,
    };
  }

  async getParamsForHandler<T extends object>(
    nameSpaceInst: T,
    methodeName: toString<keyof T>,
    params: PayloadRpc['params']
  ): Promise<PayloadRpc['params'] | never> {
    const pipesMetadata: Record<string, PipeTransform> = Reflect.getMetadata(
      JsonRpcMetadataKeyParamPipe,
      nameSpaceInst.constructor,
      methodeName
    );

    const pipeObjectByIndex: Map<number, Type<PipeTransform> | PipeTransform> =
      new Map<number, PipeTransform>();

    for (const item in pipesMetadata) {
      const index = item.split(':').at(-1);
      if (!index) {
        continue;
      }
      pipeObjectByIndex.set(parseInt(index, 10), pipesMetadata[item]);
    }

    const paramsType = Reflect.getMetadata(
      'design:paramtypes',
      nameSpaceInst.constructor.prototype,
      methodeName
    ) as ArgumentMetadata[];

    const callbackFunc = async (
      params: PayloadRpc['params'][number],
      index: number
    ): Promise<CallBackReturnType> => {
      let pipe = pipeObjectByIndex.get(index);
      if (pipe) {
        pipe = await this.getPipeByType(pipe);
      }
      return {
        pipe,
        metatype: paramsType[index],
        params,
        index,
      };
    };

    const iterate = this.asyncIterate.createIterator(params, callbackFunc);
    const argAfterParse: PayloadRpc['params'] = [];
    for await (const paramItem of iterate) {
      const { params, pipe, metatype, index } = paramItem;
      if (!pipe) {
        argAfterParse.push(params);
        continue;
      }
      try {
        const transFromParams = await pipe.transform(params, metatype);
        argAfterParse.push(transFromParams);
      } catch (e) {
        throw createError(
          e instanceof BadRequestException
            ? ErrorCodeType.InvalidRequest
            : ErrorCodeType.ServerError,
          (e as Error).message,
          `Argument: #${index}`
        );
      }
    }

    return argAfterParse;
  }

  async getPipeByType<T extends Type<PipeTransform> | PipeTransform>(
    pipe: T
  ): Promise<PipeTransform> {
    let targetPipeTransform: PipeTransform;
    if (isTypeTransform(pipe)) {
      targetPipeTransform = pipe;
    } else {
      const hasInMap = this.mapInjectPipe.get(pipe);
      if (hasInMap) {
        targetPipeTransform = hasInMap;
      } else {
        try {
          return this.moduleRef.get<PipeTransform>(pipe, {
            strict: false,
          });
        } catch (e) {
          targetPipeTransform = await this.moduleRef.create<PipeTransform>(
            pipe
          );
          this.mapInjectPipe.set(pipe, targetPipeTransform);
        }
      }
    }
    return targetPipeTransform;
  }
}
