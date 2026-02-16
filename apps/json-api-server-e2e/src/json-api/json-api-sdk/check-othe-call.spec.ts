/**
 * JSON API: Advanced Configuration - Custom Routes, Validation, and Resource Types
 *
 * This test suite demonstrates advanced JSON API configurations including custom route names,
 * UUID-based resource IDs, custom validation pipes, and method restrictions.
 *
 * Examples include:
 * - Using custom route names with @JsonApi({ overrideRoute: 'custom-name' })
 * - Working with UUID resource identifiers instead of numeric IDs
 * - Restricting available methods on specific resources
 * - Applying custom query validation pipes
 * - Direct HTTP client usage for advanced scenarios
 */

import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { Addresses, BookList, Users } from '@nestjs-json-api/typeorm-database';
import { AxiosError } from 'axios';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import { creatSdk, axiosAdapter, port, globalPrefix } from '../utils/run-application';

describe('Advanced Configuration and Custom Routes', () => {
  let jsonSdk: JsonSdkPromise;

  beforeEach(async () => {
    jsonSdk = creatSdk({
      idIsNumber: false,
    });
  });

  afterEach(async () => {});

  describe('Custom Route Names with UUID IDs', () => {
    let bookItem: BookList;

    it('should create, fetch, and delete a resource using custom route name with UUID identifier', async () => {
      bookItem = new BookList();
      bookItem.text = faker.string.alpha(50);

      const { attributes, relationships } =
        jsonSdk.jsonApiUtilsService.generateBody(bookItem);
      const url =
        jsonSdk.jsonApiUtilsService.getUrlForResource('override-book-list');

      const body = {
        data: {
          type: 'book-list',
          attributes,
          ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
        },
      };
      const newBookSource = await lastValueFrom(axiosAdapter.post(url, body));
      const newBook =
        jsonSdk.jsonApiUtilsService.convertResponseData(newBookSource);

      expect(newBook.id).toBeDefined();
      const bookResultSource = await lastValueFrom(
        // By default, id is a number, but I test uuid
        axiosAdapter.get<BookList>(`${url}/${newBookSource.data.id}`)
      );
      const bookResult =
        jsonSdk.jsonApiUtilsService.convertResponseData(bookResultSource);
      expect(bookResult.id).toBe(newBook.id);
      await lastValueFrom(
        axiosAdapter.delete(`${url}/${newBookSource.data.id}`, {
          data: {
            id: bookResult.id,
            type: 'book-list',
          },
        })
      );
    });

    it('should return error when accessing a restricted relationship endpoint', async () => {
      const url =
        jsonSdk.jsonApiUtilsService.getUrlForResource('override-book-list');
      expect.assertions(1);
      try {
        await lastValueFrom(axiosAdapter.get(`${url}/123/relationships/users`));
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
      }
    });

    it('should return validation error when providing numeric ID instead of UUID', async () => {
      const url =
        jsonSdk.jsonApiUtilsService.getUrlForResource('override-book-list');
      expect.assertions(2);
      try {
        await lastValueFrom(axiosAdapter.get(`${url}/123`));
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(400);
      }
    });
  });

  describe('Custom Query Validation Pipes', () => {
    it('should trigger custom query validation pipe and return validation error', async () => {
      expect.assertions(2);
      try {
        await jsonSdk.jsonApiSdkService.getAll(Users, {
          filter: {
            target: {
              id: {
                [FilterOperand.in]: ['1'],
              },
              firstName: {
                [FilterOperand.eq]: 'testCustomPipe',
              },
            },
          },
          fields: {
            target: ['isActive', 'id'],
            roles: ['key'],
          },
          include: ['roles'],
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(400);
      }
    });
  });

  describe('Meta Support in POST Requests', () => {
    let createdUserId: string;
    let createdAddressId: string;

    afterEach(async () => {
      if (createdUserId) {
        const userUrl = jsonSdk.jsonApiUtilsService.getUrlForResource('users');
        await lastValueFrom(axiosAdapter.delete(`${userUrl}/${createdUserId}`));
        createdUserId = '';
      }
      if (createdAddressId) {
        const addressUrl =
          jsonSdk.jsonApiUtilsService.getUrlForResource('addresses');
        await lastValueFrom(
          axiosAdapter.delete(`${addressUrl}/${createdAddressId}`)
        );
        createdAddressId = '';
      }
    });

    it('should accept meta in POST request body and apply MetaTransformPipe transformation', async () => {
      const address = new Addresses();
      address.city = faker.location.city();
      address.state = faker.location.state();
      address.country = faker.location.country();

      const addressAfterSave =
        await jsonSdk.jsonApiSdkService.postOne(address);
      createdAddressId = String(addressAfterSave.id);

      const url = jsonSdk.jsonApiUtilsService.getUrlForResource('users');

      const requestBody = {
        data: {
          type: 'users',
          attributes: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            login: faker.internet.username(),
            isActive: true,
          },
          relationships: {
            addresses: {
              data: {
                type: 'addresses',
                id: String(addressAfterSave.id),
              },
            },
          },
        },
        meta: {
          testField: 'testValue',
          source: 'e2e-test',
          timestamp: Date.now(),
        },
      };

      const response = await lastValueFrom(axiosAdapter.post(url, requestBody));

      expect(response.data).toBeDefined();
      expect(response.data.id).toBeDefined();
      createdUserId = response.data.id;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = response.meta as any;
      expect(meta).toBeDefined();
      expect(meta.transformedBy).toBe('MetaTransformPipe');
      expect(meta.transformedAt).toBeDefined();
      expect(typeof meta.transformedAt).toBe('number');
      expect(meta.adapter).toBeDefined();
      expect(['microorm', 'typeorm']).toContain(meta.adapter);

      expect(meta.testField).toBe('testValue');
      expect(meta.source).toBe('e2e-test');
      expect(meta.timestamp).toBeDefined();
    });

    it('should work without meta in POST request body (backward compatibility)', async () => {
      const address = new Addresses();
      address.city = faker.location.city();
      address.state = faker.location.state();
      address.country = faker.location.country();

      const addressAfterSave =
        await jsonSdk.jsonApiSdkService.postOne(address);
      createdAddressId = String(addressAfterSave.id);

      const url = jsonSdk.jsonApiUtilsService.getUrlForResource('users');

      const requestBody = {
        data: {
          type: 'users',
          attributes: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            login: faker.internet.username(),
            isActive: true,
          },
          relationships: {
            addresses: {
              data: {
                type: 'addresses',
                id: String(addressAfterSave.id),
              },
            },
          },
        },
      };

      const response = await lastValueFrom(axiosAdapter.post(url, requestBody));

      expect(response.data).toBeDefined();
      expect(response.data.id).toBeDefined();
      createdUserId = response.data.id;

      expect(response.meta).toBeDefined();
    });
  });

  describe('Meta Support in Atomic Operations', () => {
    it('should create address and user with lid reference using meta in atomic operations', async () => {
      const operationsUrl = `http://localhost:${port}/${globalPrefix}/operation`;

      const requestBody = {
        'atomic:operations': [
          {
            op: 'add',
            ref: {
              type: 'addresses',
              lid: 1000,
            },
            data: {
              type: 'addresses',
              attributes: {
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
              },
            },
            meta: {
              source: 'atomic-operation',
              operationType: 'create-address',
              priority: 'high',
            },
          },
          {
            op: 'add',
            ref: {
              type: 'users',
            },
            data: {
              type: 'users',
              attributes: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                login: faker.internet.username(),
                isActive: true,
              },
              relationships: {
                addresses: {
                  data: {
                    type: 'addresses',
                    id: '1000',
                  },
                },
              },
            },
            meta: {
              source: 'atomic-operation',
              operationType: 'create-user',
              linkedTo: '1',
            },
          },
        ],
      };

      const response = await lastValueFrom(
        // @ts-expect-error - atomic operations type compatibility
        axiosAdapter.post<any>(operationsUrl, requestBody)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const atomicResults = (response as any)['atomic:results'];
      expect(atomicResults).toBeDefined();
      expect(atomicResults).toHaveLength(2);

      // Extract results - each has { data, meta } structure
      const addressResult = atomicResults[0];
      const userResult = atomicResults[1];

      // Check address result
      expect(addressResult).toBeDefined();
      expect(addressResult.data).toBeDefined();
      expect(addressResult.data.id).toBeDefined();
      expect(addressResult.data.type).toBe('addresses');
      expect(addressResult.meta).toBeDefined();

      // Check user result
      expect(userResult).toBeDefined();
      expect(userResult.data).toBeDefined();
      expect(userResult.data.id).toBeDefined();
      expect(userResult.data.type).toBe('users');
      expect(userResult.meta).toBeDefined();

      // Check that user meta contains MetaTransformPipe fields
      expect(userResult.meta.transformedBy).toBe('MetaTransformPipe');
      expect(userResult.meta.transformedAt).toBeDefined();
      expect(typeof userResult.meta.transformedAt).toBe('number');
      expect(userResult.meta.adapter).toBeDefined();
      expect(['microorm', 'typeorm']).toContain(userResult.meta.adapter);

      // Check that original meta from request is preserved
      expect(userResult.meta.source).toBe('atomic-operation');
      expect(userResult.meta.operationType).toBe('create-user');
      expect(userResult.meta.linkedTo).toBe('1');

      // Verify that lid was replaced with real address ID in user relationships
      expect(userResult.data.relationships).toBeDefined();
      expect(userResult.data.relationships.addresses).toBeDefined();
      expect(userResult.data.relationships.addresses.data.id).toBe(
        addressResult.data.id
      );

      // Cleanup
      const userUrl = jsonSdk.jsonApiUtilsService.getUrlForResource('users');
      const addressUrl =
        jsonSdk.jsonApiUtilsService.getUrlForResource('addresses');

      await lastValueFrom(
        axiosAdapter.delete(`${userUrl}/${userResult.data.id}`)
      );
      await lastValueFrom(
        axiosAdapter.delete(`${addressUrl}/${addressResult.data.id}`)
      );
    });

    it('should handle atomic operations without meta (backward compatibility)', async () => {
      const operationsUrl = `http://localhost:${port}/${globalPrefix}/operation`;

      const requestBody = {
        'atomic:operations': [
          {
            op: 'add',
            ref: {
              type: 'addresses',
            },
            data: {
              type: 'addresses',
              attributes: {
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
              },
            },
          },
        ],
      };

      const response = await lastValueFrom(
        // @ts-expect-error - atomic operations type compatibility
        axiosAdapter.post<any>(operationsUrl, requestBody)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const atomicResults = (response as any)['atomic:results'];
      expect(atomicResults).toBeDefined();
      expect(atomicResults).toHaveLength(1);

      // Extract results - each has { data, meta } structure
      const addressResult = atomicResults[0];
      expect(addressResult).toBeDefined();
      expect(addressResult.data).toBeDefined();
      expect(addressResult.data.id).toBeDefined();
      expect(addressResult.meta).toBeDefined();

      // Cleanup
      const addressUrl =
        jsonSdk.jsonApiUtilsService.getUrlForResource('addresses');
      await lastValueFrom(
        axiosAdapter.delete(`${addressUrl}/${addressResult.data.id}`)
      );
    });

    it('should handle mixed atomic operations with and without meta', async () => {
      const operationsUrl = `http://localhost:${port}/${globalPrefix}/operation`;

      const requestBody = {
        'atomic:operations': [
          {
            op: 'add',
            ref: {
              type: 'addresses',
            },
            data: {
              type: 'addresses',
              attributes: {
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
              },
            },
            meta: {
              hasMetadata: true,
            },
          },
          {
            op: 'add',
            ref: {
              type: 'addresses',
            },
            data: {
              type: 'addresses',
              attributes: {
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
              },
            },
          },
        ],
      };

      const response = await lastValueFrom(
        // @ts-expect-error - atomic operations type compatibility
        axiosAdapter.post<any>(operationsUrl, requestBody)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const atomicResults = (response as any)['atomic:results'];
      expect(atomicResults).toBeDefined();
      expect(atomicResults).toHaveLength(2);

      // Extract results - each has { data, meta } structure
      const results = atomicResults;
      expect(results[0]).toBeDefined();
      expect(results[0].data).toBeDefined();
      expect(results[0].data.id).toBeDefined();
      expect(results[0].meta).toBeDefined();

      expect(results[1]).toBeDefined();
      expect(results[1].data).toBeDefined();
      expect(results[1].data.id).toBeDefined();
      expect(results[1].meta).toBeDefined();

      // Cleanup
      const addressUrl =
        jsonSdk.jsonApiUtilsService.getUrlForResource('addresses');
      await lastValueFrom(axiosAdapter.delete(`${addressUrl}/${results[0].data.id}`));
      await lastValueFrom(axiosAdapter.delete(`${addressUrl}/${results[1].data.id}`));
    });
  });
});
