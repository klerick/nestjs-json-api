import { ExecutionContext, HttpException, Logger, NestInterceptor } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable } from 'rxjs';

import { InterceptorMixin, PostgresErrors } from '../../types';
import { interceptorMixin } from './interceptor.mixin';
import * as helpers from '../../helpers/messages';

jest.mock('../../helpers/messages');


describe('InterceptorMixin', () => {
  const mixin: InterceptorMixin = interceptorMixin();
  const contextMock = {} as ExecutionContext;
  const nextMock = { handle: jest.fn() };
  let interceptor: NestInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mixin,
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
          }
        }
      ]
    }).compile();

    interceptor = module.get<NestInterceptor>(mixin);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should complete without errors', async () => {
    const handleMock = jest.spyOn(nextMock, 'handle').mockReturnValue(
      new Observable(subscriber => {
        subscriber.next(1);
        subscriber.complete();
      })
    );

    let result = await interceptor.intercept(contextMock, nextMock);
    result = await result.toPromise();
    expect(handleMock).toBeCalled();
    expect(result).toBe(1);
  });

  it('should return prepared errors for postgres', async () => {
    const preparedError = new HttpException('test', 400);
    const preparePostgresMock = (helpers.preparePostgresError as unknown as jest.Mock)
      .mockResolvedValue(preparedError);
    const appErrorMock = { code: PostgresErrors.KeyConstraint };
    const handleMock = jest.spyOn(nextMock, 'handle').mockReturnValue(
      new Observable(subscriber => {
        subscriber.error(appErrorMock);
        subscriber.complete();
      })
    );

    let error;
    try {
      const result = await interceptor.intercept(contextMock, nextMock);
      await result.toPromise();
    } catch (e) {
      error = await e;
    }

    expect(preparePostgresMock).toBeCalled();
    expect(error).toBe(preparedError);
    expect(handleMock).toBeCalled();
  });

  it('should return prepared errors for nest errors', async () => {
    const preparedError = new HttpException('test', 400);
    const prepareHttpErrorsMock = (helpers.prepareHttpError as unknown as jest.Mock)
      .mockResolvedValue(preparedError);
    const appErrorMock = new HttpException('some-error', 400);
    const handleMock = jest.spyOn(nextMock, 'handle').mockReturnValue(
      new Observable(subscriber => {
        subscriber.error(appErrorMock);
        subscriber.complete();
      })
    );

    let error;
    try {
      const result = await interceptor.intercept(contextMock, nextMock);
      await result.toPromise();
    } catch (e) {
      error = await e;
    }

    expect(prepareHttpErrorsMock).toBeCalled();
    expect(error).toBe(preparedError);
    expect(handleMock).toBeCalled();
  });

  it('should return default error message (internal error)', async () => {
    const preparePostgresErrorsMock = (helpers.preparePostgresError as unknown as jest.Mock);
    const prepareHttpErrorsMock = (helpers.prepareHttpError as unknown as jest.Mock);
    const handleMock = jest.spyOn(nextMock, 'handle').mockReturnValue(
      new Observable(subscriber => {
        subscriber.error({});
        subscriber.complete();
      })
    );

    let error: HttpException;
    try {
      const result = await interceptor.intercept(contextMock, nextMock);
      await result.toPromise();
    } catch (e) {
      error = await e;
    }

    expect(preparePostgresErrorsMock).not.toBeCalled();
    expect(prepareHttpErrorsMock).not.toBeCalled();
    expect(error.getResponse()).toStrictEqual({
      errors: [{
        detail: 'Internal server error'
      }]
    });
    expect(error.getStatus()).toBe(500);
    expect(error).toBeInstanceOf(HttpException);
    expect(handleMock).toBeCalled();
  });

  it('default error should save original stack', async () => {
    const preparePostgresErrorsMock = (helpers.preparePostgresError as unknown as jest.Mock);
    const prepareHttpErrorsMock = (helpers.prepareHttpError as unknown as jest.Mock);
    jest.spyOn(nextMock, 'handle').mockReturnValue(
      new Observable(subscriber => {
        subscriber.error({
          stack: 'some original stack'
        });
        subscriber.complete();
      })
    );

    let error: HttpException;
    try {
      const result = await interceptor.intercept(contextMock, nextMock);
      await result.toPromise();
    } catch (e) {
      error = await e;
    }

    expect(preparePostgresErrorsMock).not.toBeCalled();
    expect(prepareHttpErrorsMock).not.toBeCalled();
    expect(error.stack).toBe('some original stack');
  });
});
