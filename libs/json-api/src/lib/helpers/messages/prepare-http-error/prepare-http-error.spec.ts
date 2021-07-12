import { ExecutionContext, HttpException, NotFoundException } from '@nestjs/common';

import { prepareHttpError } from './prepare-http-error';


describe('PrepareHttpError', () => {
  it('should return new exception object', () => {
    const exceptionMock = new HttpException('mock', 400);
    const contextMock = {} as ExecutionContext;

    const result = prepareHttpError(contextMock, exceptionMock);
    expect(result).toBeInstanceOf(HttpException);
    expect(result).not.toBe(exceptionMock);
  });

  it('should return errors detail if message is a string', () => {
    const exceptionMock = new NotFoundException('mock');
    const contextMock = {} as ExecutionContext;

    const result = prepareHttpError(contextMock, exceptionMock);
    expect(result).toBeInstanceOf(HttpException);
    expect(result.getResponse()).toEqual({
      errors: [{
        detail: 'mock'
      }]
    });
  });

  it('should return errors as is if message is an object', () => {
    const exceptionMock = new NotFoundException({
      someError: 'mock'
    });
    const contextMock = {} as ExecutionContext;

    const result = prepareHttpError(contextMock, exceptionMock);
    expect(result).toBeInstanceOf(HttpException);
    expect(result.getResponse()).toEqual({
      errors: [{
        someError: 'mock'
      }]
    });
  });

  it('should return same array in error if it passed', () => {
    const errorsArrayMock = [{someError: 'mock'}, {nextError:  'mock'}];
    const exceptionMock = new NotFoundException(errorsArrayMock);
    const contextMock = {} as ExecutionContext;

    const result = prepareHttpError(contextMock, exceptionMock);
    expect(result).toBeInstanceOf(HttpException);
    expect(result.getResponse()).toEqual({
      errors: [{
        someError: 'mock'
      }, {
        nextError: 'mock'
      }]
    });
  });

  it('should save original error stack', () => {
    const errorsArrayMock = [{someError: 'mock'}, {nextError:  'mock'}];
    const exceptionMock = new NotFoundException(errorsArrayMock);
    const contextMock = {} as ExecutionContext;
    exceptionMock.stack = 'original error stack';

    const result = prepareHttpError(contextMock, exceptionMock);
    expect(result.stack).toBe(exceptionMock.stack);
  });
});
