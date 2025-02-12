import { INestApplication } from '@nestjs/common';
import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { BookList, Users } from '@nestjs-json-api/typeorm-database';
import { AxiosError } from 'axios';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import { creatSdk, run, axiosAdapter } from '../utils/run-application';

let app: INestApplication;

beforeAll(async () => {
  app = await run();
});

afterAll(async () => {
  await app.close();
});

describe('Other call type:', () => {
  let jsonSdk: JsonSdkPromise;

  beforeEach(async () => {
    jsonSdk = creatSdk({
      idIsNumber: false,
    });
  });

  afterEach(async () => {});

  describe('Check overrideRoute url name:', () => {
    let bookItem: BookList;

    it('Should be be be create book', async () => {
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
        axiosAdapter.get<BookList>(`${url}/${newBook.id}`)
      );
      const bookResult =
        jsonSdk.jsonApiUtilsService.convertResponseData(bookResultSource);
      expect(bookResult.id).toBe(newBook.id);
      await lastValueFrom(
        axiosAdapter.delete(`${url}/${bookResult.id}`, {
          data: {
            id: bookResult.id,
            type: 'book-list',
          },
        })
      );
    });

    it('Should be not allowed method', async () => {
      const url =
        jsonSdk.jsonApiUtilsService.getUrlForResource('override-book-list');
      expect.assertions(1);
      try {
        await lastValueFrom(axiosAdapter.get(`${url}/123/relationships/users`));
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
      }
    });

    it('Should be error if id is number', async () => {
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

  describe('Check custom query pipe', () => {
    it('Should be error from custom query pipe', async () => {
      expect.assertions(2);
      try {
        await jsonSdk.jonApiSdkService.getAll(Users, {
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
