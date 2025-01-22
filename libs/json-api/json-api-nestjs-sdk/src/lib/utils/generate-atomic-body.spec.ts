import { GenerateAtomicBody, Operation } from './generate-atomic-body';
import { JsonApiUtilsService } from '../service';
import { JsonApiSdkConfig } from '../types';

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

describe('GenerateAtomicBody', () => {
  let generateAtomicBody: GenerateAtomicBody;
  let jsonApiUtilsService: JsonApiUtilsService;
  const jsonApiSdkConfig: JsonApiSdkConfig = {
    apiHost: 'http://localhost:3000',
    apiPrefix: 'api/v1',
    idKey: 'id',
    idIsNumber: true,
    dateFields: [],
    operationUrl: 'operationUrl',
  };

  beforeEach(() => {
    jsonApiUtilsService = new JsonApiUtilsService(jsonApiSdkConfig);

    generateAtomicBody = new GenerateAtomicBody(
      jsonApiUtilsService,
      jsonApiSdkConfig
    );
  });

  describe('postOne & getBody', () => {
    it('should set bodyData for the post operation of a single entity', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];

      const expectedBodyData = {
        op: Operation.add,
        ref: { type: 'book-list' },
        data: {
          attributes: {
            text: entity.text,
          },
          relationships: {
            users: {
              data: [
                {
                  id: `${user.id}`,
                  type: 'users',
                },
              ],
            },
          },
          type: 'book-list',
        },
      };

      generateAtomicBody.postOne(entity);
      const result = generateAtomicBody.getBody();

      expect(result).toEqual(expectedBodyData);
    });
    it('should be be add tmpId', () => {
      const entity = new BookList();

      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.id = 'tmpId';
      entity.users = [user];

      const expectedBodyData = {
        op: Operation.add,
        ref: { type: 'book-list', tmpId: entity.id },
        data: {
          attributes: {
            text: entity.text,
          },
          relationships: {
            users: {
              data: [
                {
                  id: `${user.id}`,
                  type: 'users',
                },
              ],
            },
          },
          type: 'book-list',
        },
      };

      generateAtomicBody.postOne(entity);
      const result = generateAtomicBody.getBody();

      expect(result).toEqual(expectedBodyData);
    });
  });

  describe('patchOne', () => {
    it('should throw error if entity does not contain id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];

      expect(() => generateAtomicBody.patchOne(entity)).toThrowError();
    });

    it('should not throw error if entity contains id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];
      entity.id = 'id';
      const expectedBodyData = {
        op: Operation.update,
        ref: { type: 'book-list', id: entity.id },
        data: {
          id: entity.id,
          attributes: {
            text: entity.text,
          },
          relationships: {
            users: [
              {
                id: `${user.id}`,
                type: 'users',
              },
            ],
          },
          type: 'book-list',
        },
      };

      generateAtomicBody.patchOne(entity);
      const result = generateAtomicBody.getBody();

      expect(result).toEqual(expectedBodyData);
    });
  });

  describe('deleteOne', () => {
    it('should throw error if entity does not contain id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];

      expect(() => generateAtomicBody.deleteOne(entity, true)).toThrowError();
    });

    it('should not throw error if entity contains id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];
      entity.id = 'id';
      const expectedBodyData = {
        op: Operation.remove,
        ref: { type: 'book-list', id: entity.id },
      };

      generateAtomicBody.deleteOne(entity, true);
      const result = generateAtomicBody.getBody();
      expect(result).toEqual(expectedBodyData);
    });
  });

  describe('postRelationships', () => {
    it('should throw error if entity does not contain id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;
      entity.text = 'text';
      entity.users = [user];

      expect(() => generateAtomicBody.deleteOne(entity, true)).toThrowError();
    });

    it('should not throw error if entity contains id', () => {
      const entity = new BookList();
      const user = new Users();
      user.id = 1;

      const user2 = new Users();
      user2.id = 3;
      entity.text = 'text';
      entity.users = [user, user2];
      entity.id = 'id';
      const expectedBodyData = {
        op: Operation.add,
        ref: {
          type: 'book-list',
          id: entity.id,
          relationship: 'users',
        },
        data: [
          {
            id: user.id.toString(),
            type: 'users',
          },
          {
            id: user2.id.toString(),
            type: 'users',
          },
        ],
      };

      generateAtomicBody.postRelationships(entity, 'users');
      const result = generateAtomicBody.getBody();

      expect(result).toEqual(expectedBodyData);
    });
  });
});
