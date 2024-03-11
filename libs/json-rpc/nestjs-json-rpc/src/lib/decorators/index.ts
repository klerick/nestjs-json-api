import {
  applyDecorators,
  Inject,
  Injectable,
  PipeTransform,
  SetMetadata,
} from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';
import {
  JsonRpcMetadataKey,
  JsonRpcMetadataKeyParamPipe,
  RPC_CONTEXT,
} from '../constants';

export const RpcHandler = () => {
  return applyDecorators(SetMetadata(JsonRpcMetadataKey, true), Injectable());
};

// export function InjectContext(): PropertyDecorator {
//   return (target, key) => {
//     Inject(RPC_CONTEXT)(target, key);
//   };
// }

export const RpcParamsPipe = (
  pipe: Type<PipeTransform> | PipeTransform
): ParameterDecorator => {
  return (target, key, index) => {
    if (!key) {
      throw Error('key is undefined');
    }
    const args: Record<string, Type<PipeTransform> | PipeTransform> =
      Reflect.getMetadata(
        JsonRpcMetadataKeyParamPipe,
        target.constructor,
        key
      ) || {};
    Reflect.defineMetadata(
      JsonRpcMetadataKeyParamPipe,
      Object.assign(Object.assign({}, args), { [`params:${index}`]: pipe }),
      target.constructor,
      key
    );
  };
};
