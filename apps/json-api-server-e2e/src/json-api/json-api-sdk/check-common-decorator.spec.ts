import {
  adapterForAxios,
  FilterOperand,
  JsonApiJs,
  JsonSdkPromise,
} from 'json-api-nestjs-sdk';
import axios, { AxiosError } from 'axios';
import { Users } from 'database';

describe('Check common decorator', () => {
  let jsonSdk: JsonSdkPromise;
  const axiosAdapter = adapterForAxios(axios);
  beforeEach(async () => {
    jsonSdk = JsonApiJs(
      {
        adapter: axiosAdapter,
        apiHost: 'http://localhost:3000',
        apiPrefix: 'api',
        dateFields: ['createdAt', 'updatedAt'],
        operationUrl: 'operation',
        idIsNumber: false,
      },
      true
    );
  });

  afterEach(async () => {});

  describe('Check Interceptor', () => {
    it('Should be call controller interceptor', async () => {
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

    it('Should be call methode interceptor', async () => {
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

  describe('Check Filter', () => {
    it('Should be able to filter controller by firstName', async () => {
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
        expect(((e as AxiosError).response?.data as any)?.path).toBe(
          '/api/users?filter[firstName][eq]=testControllerFilter'
        );
        expect(((e as AxiosError).response?.data as any)?.method).toBe(false);
      }
    });
    it('Should be able to filter testMethodFilter by firstName', async () => {
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
        expect(((e as AxiosError).response?.data as any)?.path).toBe(
          '/api/users?filter[firstName][eq]=testMethodFilter'
        );
        expect(((e as AxiosError).response?.data as any)?.method).toBe(true);
      }
    });
  });

  describe('Check Guard', () => {
    it('Should be be call controller guard', async () => {
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
    it('Should be be call methode guard', async () => {
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
