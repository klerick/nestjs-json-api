import { Test } from '@nestjs/testing';
import { InputDataPipe } from './input-data.pipe';
import { ErrorCodeType, PayloadRpcData } from '../../../types';
import { zodInputDataProvider } from '../../../providers/zod-input-data.provider';
import { RpcError } from '@klerick/nestjs-json-rpc';
import { ErrorCode } from '../../../constants';

describe('input-data.pipe', () => {
  let inputDataPipe: InputDataPipe;
  beforeEach(async () => {
    const testModuleRef = await Test.createTestingModule({
      providers: [InputDataPipe, zodInputDataProvider],
    }).compile();

    inputDataPipe = testModuleRef.get(InputDataPipe);
  });

  it('Should be ok one item', () => {
    const value = {
      jsonrpc: '2.0',
      id: 1,
      params: ['1', '2'],
      method: 'TestClass.testMethode',
    };
    const expectedResult: PayloadRpcData = {
      jsonrpc: '2.0',
      id: 1,
      params: ['1', '2'],
      method: {
        methodName: 'testMethode',
        spaceName: 'TestClass',
      },
    };
    expect(inputDataPipe.transform(value)).toEqual(expectedResult);
  });

  it('Should be ok array', () => {
    const value = [
      {
        jsonrpc: '2.0',
        id: 1,
        params: ['1', '2'],
        method: 'TestClass.testMethode',
      },
    ];
    const expectedResult: PayloadRpcData = [
      {
        jsonrpc: '2.0',
        id: 1,
        params: ['1', '2'],
        method: {
          methodName: 'testMethode',
          spaceName: 'TestClass',
        },
      },
    ];
    expect(inputDataPipe.transform(value)).toEqual(expectedResult);
  });
  it('Should be error', () => {
    expect.assertions(3);
    try {
      inputDataPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcError).code).toBe(
        ErrorCode[ErrorCodeType.InvalidRequest]
      );
      expect((e as RpcError).id).toBe(null);
    }
  });
  it('Should be error after array', () => {
    expect.assertions(3);
    try {
      inputDataPipe.transform([{}]);
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcError).code).toBe(
        ErrorCode[ErrorCodeType.InvalidRequest]
      );
      expect((e as RpcError).id).toBe(null);
    }
  });
  it('Should be error after array with id', () => {
    expect.assertions(3);
    const val = [
      {
        id: 1,
        method: 'TestClass',
      },
    ];
    try {
      inputDataPipe.transform(val);
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcError).code).toBe(
        ErrorCode[ErrorCodeType.InvalidRequest]
      );

      expect((e as RpcError).id).toBe(val[0].id);
    }
  });
  it('Should be error after array with id inner', () => {
    expect.assertions(3);
    const val = [
      {
        jsonrpc: '2.0',
        id: 1,
        params: ['1', '2'],
        method: 'TestClass.testMethode',
      },
      {
        id: 2,
        method: 'TestClass',
      },
    ];
    try {
      inputDataPipe.transform(val);
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcError).code).toBe(
        ErrorCode[ErrorCodeType.InvalidRequest]
      );

      expect((e as RpcError).id).toBe(val[1].id);
    }
  });
  it('Should be error after array with id', () => {
    expect.assertions(3);
    const val = {
      id: 1,
      method: 'TestClass',
    };
    try {
      inputDataPipe.transform(val);
    } catch (e) {
      expect(e).toBeInstanceOf(RpcError);
      expect((e as RpcError).code).toBe(
        ErrorCode[ErrorCodeType.InvalidRequest]
      );

      expect((e as RpcError).id).toBe(val.id);
    }
  });
});
