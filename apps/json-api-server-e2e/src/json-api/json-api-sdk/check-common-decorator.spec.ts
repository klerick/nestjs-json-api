/**
 * JSON API: Common Decorators - Guards, Interceptors, and Filters
 *
 * This test suite demonstrates how NestJS common decorators work with the JSON API library.
 * It verifies that standard NestJS decorators (Guards, Interceptors, Filters) can be applied
 * at both controller and method levels to JSON API endpoints.
 *
 * Examples include:
 * - Applying interceptors at controller and method levels
 * - Using custom filters at controller and method levels
 * - Protecting endpoints with guards at controller and method levels
 * - Proper error handling and HTTP status codes
 */

import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';
import { Users } from '@nestjs-json-api/typeorm-database';

import { creatSdk } from '../utils/run-application';

describe('NestJS Common Decorators Integration', () => {
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
  });

  afterEach(async () => {});

  describe('Interceptors', () => {
    it('should trigger controller-level interceptor and return validation error', async () => {
      expect.assertions(3);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testControllerInterceptor',
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(400);
        expect(
          ((e as AxiosError).response?.data as any)?.message[0].message.indexOf(
            'testControllerInterceptor'
          )
        ).toBe(0);
      }
    });

    it('should trigger method-level interceptor and return validation error', async () => {
      expect.assertions(3);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testMethodInterceptor',
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(400);
        expect(
          ((e as AxiosError).response?.data as any)?.message[0].message.indexOf(
            'testMethodInterceptor'
          )
        ).toBe(0);
      }
    });
  });

  describe('Exception Filters', () => {
    it('should trigger controller-level exception filter and return custom HTTP status code', async () => {
      expect.assertions(4);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testControllerFilter',
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(418);
        expect(decodeURI(((e as AxiosError).response?.data as any)?.path)).toBe(
          '/api/users?filter[firstName][eq]=testControllerFilter'
        );
        expect(((e as AxiosError).response?.data as any)?.method).toBe(false);
      }
    });
    it('should trigger method-level exception filter and return custom HTTP status code', async () => {
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testMethodFilter',
              },
            },
          },
        });
      } catch (e) {
        expect.assertions(4);
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(412);
        expect(decodeURI(((e as AxiosError).response?.data as any)?.path)).toBe(
          '/api/users?filter[firstName][eq]=testMethodFilter'
        );
        expect(((e as AxiosError).response?.data as any)?.method).toBe(true);
      }
    });
  });

  describe('Guards', () => {
    it('should trigger controller-level guard and deny access with 403 Forbidden', async () => {
      expect.assertions(3);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testControllerGuard',
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
        expect(((e as AxiosError).response?.data as any)?.message).toBe(
          'Forbidden resource'
        );
      }
    });
    it('should trigger method-level guard and deny access with 403 Forbidden', async () => {
      expect.assertions(3);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
          filter: {
            target: {
              firstName: {
                [FilterOperand.eq]: 'testMethodeGuard',
              },
            },
          },
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
        expect(((e as AxiosError).response?.data as any)?.message).toBe(
          'Not allow to Users'
        );
      }
    });
  });
});
