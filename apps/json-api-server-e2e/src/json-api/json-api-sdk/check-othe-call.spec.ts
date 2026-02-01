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
import { BookList, Users } from '@nestjs-json-api/typeorm-database';
import { AxiosError } from 'axios';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import { creatSdk, axiosAdapter } from '../utils/run-application';

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
});
