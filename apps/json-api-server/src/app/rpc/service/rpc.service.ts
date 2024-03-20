import {
  InputType,
  OutputType,
  RpcService as IRpcService,
} from '@nestjs-json-api/type-for-rpc';

import {
  createErrorCustomError,
  RpcHandler,
  RpcParamsPipe,
} from '@klerick/nestjs-json-rpc';
import { ParseIntPipe } from '@nestjs/common';

@RpcHandler()
export class RpcService implements IRpcService {
  methodeWithObjectParams(a: InputType): Promise<OutputType> {
    return Promise.resolve({
      d: `${a.a}`,
      c: `${a.b}`,
    });
  }

  someMethode(@RpcParamsPipe(ParseIntPipe) firstArg: number): Promise<number> {
    if (firstArg === 5) throw createErrorCustomError(-32099, 'Custom Error');
    return Promise.resolve(firstArg);
  }

  someOtherMethode(firstArg: number, secondArgument: number): Promise<string> {
    return Promise.resolve('');
  }
}
