import { lastValueFrom, of } from 'rxjs';
import { KEY_MAIN_OUTPUT_SCHEMA } from '@klerick/json-api-nestjs-shared';
import { AtomicOperationsService } from './atomic-operations.service';
import { JsonApiUtilsService } from './index';
import { HttpInnerClient, JsonApiSdkConfig } from '../types';

class Users {
  public id!: number;
  public login!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
  public addresses!: Addresses;
  public books!: BookList[];
}

class BookList {
  public id!: string;
  public text!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public users!: Users[];
}

class Addresses {
  public id!: number;
  public city!: string;
  public state!: string;
  public country!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public user!: Users;
}

const users = new Users();

const bookList = new BookList();
bookList.id = '1';
bookList.text = 'Name book';

const addresses = new Addresses();
addresses.city = 'Moscow';
addresses.country = 'Rus';

users.id = 1;
users.addresses = addresses;
users.firstName = 'Alex';
users.lastName = 'H';
users.login = 'alexH';

const patchUser = { ...users } as Users;
patchUser.books = [bookList];

describe('atomicOperationService', () => {
  let atomicOperationsService: AtomicOperationsService<[]>;
  let jsonApiUtilsService: JsonApiUtilsService;
  let httpInnerClient: HttpInnerClient;

  const jsonApiSdkConfig: JsonApiSdkConfig = {
    apiHost: 'http://localhost:3000',
    apiPrefix: 'api/v1',
    idKey: 'id',
    idIsNumber: true,
    operationUrl: 'operationUrl',
    dateFields: [],
  };

  beforeEach(() => {
    httpInnerClient = {
      post: vi.fn(),
    } as any;

    jsonApiUtilsService = new JsonApiUtilsService(jsonApiSdkConfig);
    atomicOperationsService = new AtomicOperationsService<[]>(
      jsonApiUtilsService,
      jsonApiSdkConfig,
      httpInnerClient
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Check atomicFactory', () => {
    it('Should be return factory', async () => {
      const postAddress = new Addresses();
      postAddress.id = 1;
      const patchUser = new Users();
      patchUser.id = 1;

      const deleteUser = new Users();
      deleteUser.id = 2;
      const patchRelationshipsBookList = new BookList();
      patchRelationshipsBookList.id = 'id';
      patchRelationshipsBookList.users = [patchUser];

      const deleteRelationshipsAddress = new Addresses();
      deleteRelationshipsAddress.id = 2;
      deleteRelationshipsAddress.user = deleteUser;

      patchUser.addresses = postAddress;

      const spyHttpInnerClient = vi
        .spyOn(httpInnerClient, 'post')
        .mockImplementation(() =>
          of({
            [KEY_MAIN_OUTPUT_SCHEMA]: [
              {
                meta: {},
                data: {
                  type: 'users',
                  id: patchUser.id,
                  attributes: {},
                },
              },
              {
                meta: {},
                data: {
                  type: 'addresses',
                  id: postAddress.id,
                  attributes: {},
                },
              },
              {
                meta: {},
                data: [
                  {
                    type: 'users',
                    id: patchUser.id,
                    attributes: {},
                  },
                ],
              },
              {
                meta: {},
                data: {
                  type: 'addresses',
                  id: postAddress.id,
                  attributes: {},
                },
              },
            ],
          })
        );

      const result$ = atomicOperationsService
        .patchOne(patchUser)
        .deleteOne(deleteUser)
        .postOne(postAddress)
        .patchRelationships(patchRelationshipsBookList, 'users')
        .postRelationships(patchUser, 'addresses')
        .deleteRelationships(deleteRelationshipsAddress, 'user')
        .run();

      const result = await lastValueFrom(result$);
      expect(spyHttpInnerClient).toBeCalledTimes(1);
      const pathUserResult = new Users();
      pathUserResult.id = patchUser.id;
      expect(result).toEqual([
        pathUserResult,
        postAddress,
        [patchRelationshipsBookList.users[0].id],
        patchUser.addresses.id,
      ]);
    });
    it('Should be return factory with skip false', async () => {
      const postAddress = new Addresses();
      postAddress.id = 1;
      const patchUser = new Users();
      patchUser.id = 1;

      const deleteUser = new Users();
      deleteUser.id = 2;
      const patchRelationshipsBookList = new BookList();
      patchRelationshipsBookList.id = 'id';
      patchRelationshipsBookList.users = [patchUser];

      const deleteRelationshipsAddress = new Addresses();
      deleteRelationshipsAddress.id = 2;
      deleteRelationshipsAddress.user = deleteUser;

      patchUser.addresses = postAddress;

      const spyHttpInnerClient = vi
        .spyOn(httpInnerClient, 'post')
        .mockImplementation(() =>
          of({
            [KEY_MAIN_OUTPUT_SCHEMA]: [
              {
                meta: {},
                data: {
                  type: 'users',
                  id: patchUser.id,
                  attributes: {},
                },
              },
              {
                meta: {},
                data: {
                  type: 'addresses',
                  id: postAddress.id,
                  attributes: {},
                },
              },
              {
                meta: {},
                data: [
                  {
                    type: 'users',
                    id: patchUser.id,
                    attributes: {},
                  },
                ],
              },
              {
                meta: {},
                data: {
                  type: 'addresses',
                  id: postAddress.id,
                  attributes: {},
                },
              },
            ],
          })
        );

      const result$ = atomicOperationsService
        .patchOne(patchUser)
        .deleteOne(deleteUser, false)
        .postOne(postAddress)
        .patchRelationships(patchRelationshipsBookList, 'users')
        .postRelationships(patchUser, 'addresses')
        .deleteRelationships(deleteRelationshipsAddress, 'user')
        .run();

      const result = await lastValueFrom(result$);
      expect(spyHttpInnerClient).toBeCalledTimes(1);
      const pathUserResult = new Users();
      pathUserResult.id = patchUser.id;
      expect(result).toEqual([
        pathUserResult,
        'EMPTY',
        postAddress,
        [patchRelationshipsBookList.users[0].id],
        patchUser.addresses.id,
      ]);
    });
  });
  it('Should be return factory with skip false only delete', async () => {
    const postAddress = new Addresses();
    postAddress.id = 1;
    const patchUser = new Users();
    patchUser.id = 1;

    const deleteUser = new Users();
    deleteUser.id = 2;
    const patchRelationshipsBookList = new BookList();
    patchRelationshipsBookList.id = 'id';
    patchRelationshipsBookList.users = [patchUser];

    const deleteRelationshipsAddress = new Addresses();
    deleteRelationshipsAddress.id = 2;
    deleteRelationshipsAddress.user = deleteUser;

    patchUser.addresses = postAddress;

    const spyHttpInnerClient = vi
      .spyOn(httpInnerClient, 'post')
      .mockImplementation(() =>
        of({
          [KEY_MAIN_OUTPUT_SCHEMA]: [],
        })
      );

    const result$ = atomicOperationsService.deleteOne(deleteUser, false).run();

    const result = await lastValueFrom(result$);
    expect(spyHttpInnerClient).toBeCalledTimes(1);
    const pathUserResult = new Users();
    pathUserResult.id = patchUser.id;
    expect(result).toEqual(['EMPTY']);
  });
});
