import { TestBed } from '@angular/core/testing';
import { RelationshipData } from 'json-api-nestjs';

import { JsonApiUtilsService } from './json-api-utils.service';

import {
  JsonApiSdkConfig,
  JSON_API_SDK_CONFIG,
  ALL_ENTITIES,
} from '../../token/json-api-sdk';

import { QueryParams } from '../../types';
import { EmptyArrayRelation } from '../../utils';

const config: JsonApiSdkConfig = {
  apiHost: 'http://localhost:3000',
  apiPrefix: 'api',
};

class Roles {
  id!: string;
  name!: string;
}

class Comments {
  id!: string;
  text!: string;
}

class Users {
  id!: string;
  name!: string;
  items!: string[];
  role!: Roles[];
  comments!: Comments;
}

describe('JsonApiUtilsService', () => {
  let service: JsonApiUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: JSON_API_SDK_CONFIG,
          useValue: config,
        },
        {
          provide: ALL_ENTITIES,
          useValue: {
            Users,
            Roles,
            Comments,
          },
        },
      ],
    });
    service = TestBed.inject(JsonApiUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUrlForResource', () => {
    it('Check getUrlForResource: resource is "CamelCase"', () => {
      const result = service.getUrlForResource('CamelCase');
      expect(result).toBe(`${config.apiHost}/${config.apiPrefix}/camel-case`);
    });

    it('Check getUrlForResource: resource is "Resource"', () => {
      const result = service.getUrlForResource('Resource');
      expect(result).toBe(`${config.apiHost}/${config.apiPrefix}/resource`);
    });
  });

  describe('Check query string generator', () => {
    it('Check include param', () => {
      const include: QueryParams<Users>['include'] = ['role', 'comments'];
      const httpParams = service.getQueryStringParams<Users>({ include });
      expect(httpParams.get('include')).toBe(include.join(','));
    });

    it('Check include param: empty array', () => {
      const include: QueryParams<Users>['include'] = [];
      const httpParams = service.getQueryStringParams<Users>({ include });
      expect(httpParams.get('include')).toBe(null);
    });

    it('Check include param: string and emtpy', () => {
      const httpParams = service.getQueryStringParams<Users>({
        include: '',
      } as any);
      const httpParams1 = service.getQueryStringParams<Users>({});
      expect(httpParams.get('include')).toBe(null);
      expect(httpParams1.get('include')).toBe(null);
    });

    it('Check sort param', () => {
      const sort: QueryParams<Users>['sort'] = {
        role: {
          name: 'ASC',
        },
        target: {
          name: 'DESC',
        },
      };
      const httpParams = service.getQueryStringParams<Users>({ sort });
      expect(httpParams.get('sort')).toBe(['-name', 'role.name'].join(','));

      const sort1: QueryParams<Users>['sort'] = {
        role: {
          name: 'DESC',
        },
        target: {
          name: 'ASC',
        },
      };
      const httpParams1 = service.getQueryStringParams<Users>({ sort: sort1 });
      expect(httpParams1.get('sort')).toBe(['name', '-role.name'].join(','));

      const sort2: QueryParams<Users>['sort'] = {
        role: {
          name: 'DESC',
        },
      };
      const httpParams2 = service.getQueryStringParams<Users>({ sort: sort2 });
      expect(httpParams2.get('sort')).toBe(['-role.name'].join(','));

      const sort3: QueryParams<Users>['sort'] = {
        target: {
          name: 'ASC',
        },
      };
      const httpParams3 = service.getQueryStringParams<Users>({ sort: sort3 });
      expect(httpParams3.get('sort')).toBe(['name'].join(','));
    });

    it('Check sort param: string and empty', () => {
      const httpParams = service.getQueryStringParams<Users>({
        sort: '',
      } as any);
      const httpParams1 = service.getQueryStringParams<Users>({});
      const httpParams2 = service.getQueryStringParams<Users>({
        sort: null,
      } as any);
      const httpParams3 = service.getQueryStringParams<Users>({
        sort: {},
      } as any);
      expect(httpParams.get('sort')).toBe(null);
      expect(httpParams1.get('sort')).toBe(null);
      expect(httpParams2.get('sort')).toBe(null);
      expect(httpParams3.get('sort')).toBe(null);
    });

    it('Check page params', () => {
      const httpParams = service.getQueryStringParams<Users>({
        page: { number: 100, size: 100 },
      });
      expect(httpParams.get('page[number]')).toBe('100');
      expect(httpParams.get('page[size]')).toBe('100');

      const httpParams1 = service.getQueryStringParams<Users>({});
      expect(httpParams1.get('page[number]')).toBe(null);
      expect(httpParams1.get('page[size]')).toBe(null);

      const httpParams2 = service.getQueryStringParams<Users>({
        page: {},
      } as any);
      expect(httpParams2.get('page[number]')).toBe('1');
      expect(httpParams2.get('page[size]')).toBe(null);
    });

    describe('Check filter params', () => {
      it('Check filter', () => {
        const httpParams = service.getQueryStringParams<Users>({
          filter: {
            target: {
              name: {
                like: 'test',
              },
              items: {
                in: ['test', 'test1'],
              },
            },
            relation: {
              comments: {
                text: {
                  ne: 'text',
                },
              },
              role: {
                name: {
                  eq: 'text',
                },
              },
            },
          },
        });

        expect(httpParams.get('filter[name][like]')).toBe('test');
        expect(httpParams.get('filter[items][in]')).toBe(
          ['test', 'test1'].join(',')
        );
        expect(httpParams.get('filter[comments.text][ne]')).toBe('text');
        expect(httpParams.get('filter[role.name][eq]')).toBe('text');
      });
      it('Check filter, w/o relation', () => {
        const httpParams = service.getQueryStringParams<Users>({
          filter: {
            target: {
              name: {
                like: 'test',
              },
              items: {
                in: ['test', 'test1'],
              },
            },
          },
        });

        expect(httpParams.get('filter[name][like]')).toBe('test');
        expect(httpParams.get('filter[items][in]')).toBe(
          ['test', 'test1'].join(',')
        );
      });
      it('Check filter, w/o target', () => {
        const httpParams = service.getQueryStringParams<Users>({
          filter: {
            relation: {
              comments: {
                text: {
                  ne: 'text',
                },
              },
              role: {
                name: {
                  eq: 'text',
                },
              },
            },
          },
        });

        expect(httpParams.get('filter[comments.text][ne]')).toBe('text');
        expect(httpParams.get('filter[role.name][eq]')).toBe('text');
      });
      it('Check filter, empty filter', () => {
        const httpParams = service.getQueryStringParams<Users>({
          filter: {},
        });
        expect(httpParams.keys().length).toBe(0);
        const httpParams1 = service.getQueryStringParams<Users>({
          filter: {
            relation: {},
            target: {},
          },
        });
        expect(httpParams1.keys().length).toBe(0);
      });
    });

    it('Check filed param', () => {
      const httpParams = service.getQueryStringParams<Users>({
        fields: {
          target: ['name', 'items', 'name'],
          role: ['name', 'name'],
          comments: ['text'],
        },
      });
      expect(httpParams.get('fields[target]')).toBe('name,items');
      expect(httpParams.get('fields[role]')).toBe('name');
      expect(httpParams.get('fields[comments]')).toBe('text');
    });
  });

  describe('Generate body', () => {
    it('Should be correct body object, w/o id, w/o relation', () => {
      const user = new Users();
      user.name = 'name';
      const result = service.generateBody<Users>(user);
      expect(result).not.toHaveProperty('id');
      expect(result).toHaveProperty('attributes');
      expect(result.attributes).toHaveProperty('name');
      expect(result.attributes?.name).toBe(user.name);
      expect(result.attributes).not.toHaveProperty('items');
      expect(result).toHaveProperty('relationships');
      expect(result.relationships).toEqual({});
    });

    it('Should be correct body object, with id, with relation', () => {
      const user = new Users();
      const comments = new Comments();
      const role = new Roles();

      comments.id = '1';
      role.id = '2';
      user.name = 'name';
      user.id = '1';
      user.role = [role];
      user.comments = comments;
      const result = service.generateBody<Users>(user);
      expect(result).not.toHaveProperty('id');
      expect(result).toHaveProperty('attributes');
      expect(result.attributes).toHaveProperty('name');
      expect(result.attributes?.name).toBe(user.name);
      expect(result.attributes).not.toHaveProperty('items');
      expect(result).toHaveProperty('relationships');
      expect(result.relationships).toHaveProperty('comments');
      expect(result.relationships).toHaveProperty('role');
      expect(result.relationships?.comments).toHaveProperty('data');
      expect(result.relationships?.comments?.data).toHaveProperty('type');
      expect(result.relationships?.comments?.data).toHaveProperty('id');
      expect(result.relationships?.comments?.data?.id).toBe(comments.id);
      expect(result.relationships?.comments?.data?.type).toBe('comments');
      expect(result.relationships?.role).toHaveProperty('data');
      expect(Array.isArray(result.relationships?.role?.data)).toBe(true);
      expect(
        Array.isArray(result.relationships?.role?.data) &&
          result.relationships?.role?.data.length === 1
      ).toBe(true);
      const roleItem = (result.relationships?.role?.data as any[]).shift();
      expect(roleItem).toHaveProperty('type');
      expect(roleItem).toHaveProperty('id');
      expect(roleItem.id).toBe(role.id);
      expect(roleItem.type).toBe('roles');
    });

    it('Should be correct body object, with id, with null relation', () => {
      const user = new Users();

      user.name = 'name';
      user.id = '1';
      user.role = new EmptyArrayRelation();
      user.comments = Object.assign(new Comments(), { id: null });
      const result = service.generateBody<Users>(user);
      expect(result).not.toHaveProperty('id');
      expect(result).toHaveProperty('attributes');
      expect(result.attributes).toHaveProperty('name');
      expect(result.attributes?.name).toBe(user.name);
      expect(result.attributes).not.toHaveProperty('items');
      expect(result).toHaveProperty('relationships');
      expect(result.relationships).toHaveProperty('comments');
      expect(result.relationships).toHaveProperty('role');
      expect(result.relationships?.comments).toHaveProperty('data');
      expect(result.relationships?.comments?.data).toBe(null);
      expect(result.relationships?.role).toHaveProperty('data');
      expect(Array.isArray(result.relationships?.role?.data)).toBe(true);
      expect(
        Array.isArray(result.relationships?.role?.data) &&
          result.relationships?.role?.data.length === 0
      ).toBe(true);
    });
  });

  describe('Convert response data', () => {
    it('should be correct convert', () => {
      const dataBody = {
        data: {
          id: '1',
          type: 'users',
          attributes: {
            name: 'name',
          },
        },
      };
      const [result] = service.convertResponseData<Users>(dataBody as any);
      expect(result).toBeInstanceOf(Users);
      expect(result.id).toBe(dataBody.data.id);
      expect(result.name).toBe(dataBody.data.attributes.name);
      expect(result).not.toHaveProperty('item');
    });

    it('should be correct convert with include', () => {
      const dataBody = {
        data: {
          id: '1',
          type: 'users',
          attributes: {
            name: 'name',
            items: 'items',
          },
          relationships: {
            comments: {
              data: { id: '1', type: 'comments' },
            },
            role: {
              data: [{ id: '2', type: 'roles' } as RelationshipData<Roles>],
            },
          },
        },
        included: [
          {
            id: '1',
            type: 'comments',
            attributes: {
              text: 'name-comment',
            },
          },
          {
            id: '2',
            type: 'roles',
            attributes: {
              name: 'name-role',
            },
          },
        ],
      };
      const [result] = service.convertResponseData<Users>(dataBody, [
        'role',
        'comments',
      ]);
      expect(result).toBeInstanceOf(Users);
      expect(result.id).toBe(dataBody.data.id);
      expect(result.name).toBe(dataBody.data.attributes.name);
      expect(result.items).toBe(dataBody.data.attributes.items);
      expect(result).toHaveProperty('role');
      expect(Array.isArray(result.role)).toBe(true);
      expect(result.role[0].name).toBe(dataBody.included[1].attributes.name);
      expect(result).toHaveProperty('comments');
      expect(Array.isArray(result.comments)).toBe(false);
      expect(result.comments.text).toBe(dataBody.included[0].attributes.text);
    });
  });
});
