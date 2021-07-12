import { ExecutionContext, HttpException } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

import { preparePostgresError } from './prepare-postgres-error';
import { PostgresErrors, QueryField } from '../../../types';
import Mock = jest.Mock;


describe('PreparePostgresError', () => {
  const httpRequestMock = {
    getResponse: jest.fn() as Mock,
    getRequest: jest.fn() as Mock,
    getNext: jest.fn() as Mock,
  } as HttpArgumentsHost;

  const contextMock = {
    switchToHttp() {
      return httpRequestMock;
    }
  } as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return new exception object', () => {
    const exceptionMock = { code: PostgresErrors.OperatorDoesNotExist };
    const result = preparePostgresError(contextMock, exceptionMock);
    expect(result).toBeInstanceOf(HttpException);
    expect(result).not.toBe(exceptionMock);
    expect(result.getStatus()).toBe(409);
  });

  it('should return correct error on invalid value', () => {
    const exceptionMock = {
      code: PostgresErrors.InvalidTimestamp,
      message: 'Some value "test-value" is  not valid',
    };
    const requestMock =  jest.spyOn(httpRequestMock, 'getRequest')
      .mockReturnValue({
        query: {
          filter: {
            'some-filter': 'test-value'
          }
        }
      });

    const result = preparePostgresError(contextMock, exceptionMock);
    expect((result.getResponse() as any).errors[0].source.parameter).toBe(QueryField.filter);
    expect((result.getResponse() as any).errors[0].detail).toContain("'some-filter'");
    expect((result.getResponse() as any).errors).toHaveLength(1);
    expect(requestMock).toBeCalled();
  });

  it('Should return correct error on duplicate key', () =>  {
    const exceptionMock = {
      code: PostgresErrors.DuplicateKey,
      detail: 'Parameter (someKey) (someValue)',
    };

    const result = preparePostgresError(contextMock, exceptionMock);
    expect((result.getResponse() as any).errors[0].source.pointer).toBe('/data/attributes/someKey');
    expect((result.getResponse() as any).errors[0].detail).toContain("'someKey'");
    expect((result.getResponse() as any).errors[0].detail).toContain("'someValue'");
    expect((result.getResponse() as any).errors).toHaveLength(1);
  });

  it('Should return correct error on key constraint', () =>  {
    const exceptionMock = { code: PostgresErrors.KeyConstraint };

    const result = preparePostgresError(contextMock, exceptionMock);
    expect((result.getResponse() as any).errors[0].source).toBe(undefined);
    expect((result.getResponse() as any).errors[0].detail).toBeDefined();
    expect((result.getResponse() as any).errors).toHaveLength(1);
  });

  it('Should save original error stack', () =>  {
    const exceptionMock = {
      code: PostgresErrors.KeyConstraint,
      stack: 'original error stack',
    };

    const result = preparePostgresError(contextMock, exceptionMock);
    expect(result.stack).toBe(exceptionMock.stack);
  });
});
