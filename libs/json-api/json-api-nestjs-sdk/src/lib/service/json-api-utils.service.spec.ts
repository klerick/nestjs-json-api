import { JsonApiUtilsService } from './json-api-utils.service';
import { JsonApiSdkConfig, QueryParams } from '../types';
import { HttpParams } from '../utils';

describe('JsonApiUtilsService', () => {
  let service: JsonApiUtilsService;
  const mockJsonApiSdkConfig: JsonApiSdkConfig = {
    apiHost: 'http://localhost:3000',
    apiPrefix: 'api/v1',
    idKey: 'id',
    idIsNumber: true,
    dateFields: [],
  };

  beforeEach(async () => {
    service = new JsonApiUtilsService(mockJsonApiSdkConfig);
  });

  it('should correctly construct the URL for the resource', () => {
    const resource = 'MyResource';
    const expectedUrl = 'http://localhost:3000/api/v1/my-resource';
    const url = service.getUrlForResource(resource);
    expect(url).toEqual(expectedUrl);
  });

  it('should call all helper functions with correct parameters', () => {
    // Mock the helper functions
    const includeSpy = vi
      // @ts-ignore
      .spyOn(service, 'getIncludeParam')
      // @ts-ignore
      .mockReturnValue(new HttpParams());

    const sortSpy = vi
      // @ts-ignore
      .spyOn(service, 'getSortParam')
      // @ts-ignore
      .mockReturnValue(new HttpParams());

    const pageSpy = vi
      // @ts-ignore
      .spyOn(service, 'getPageParam')
      // @ts-ignore
      .mockReturnValue(new HttpParams());

    const fieldSpy = vi
      // @ts-ignore
      .spyOn(service, 'getFieldParam')
      // @ts-ignore
      .mockReturnValue(new HttpParams());

    const filterSpy = vi
      // @ts-ignore
      .spyOn(service, 'getFilterParam')
      // @ts-ignore
      .mockReturnValue(new HttpParams());

    const testParams = {
      include: 'test-include',
      sort: 'test-sort',
      page: 'test-page',
      fields: 'test-fields',
      filter: 'test-filter',
    };

    service.getQueryStringParams(testParams as any);

    expect(includeSpy).toHaveBeenCalledWith(
      testParams.include,
      expect.any(HttpParams)
    );
    expect(sortSpy).toHaveBeenCalledWith(
      testParams.sort,
      expect.any(HttpParams)
    );
    expect(pageSpy).toHaveBeenCalledWith(
      testParams.page,
      expect.any(HttpParams)
    );
    expect(fieldSpy).toHaveBeenCalledWith(
      testParams.fields,
      expect.any(HttpParams)
    );
    expect(filterSpy).toHaveBeenCalledWith(
      testParams.filter,
      expect.any(HttpParams)
    );
  });

  describe('getIncludeParam', () => {
    it('should set include parameter when valid array is passed', () => {
      const includeArray: string[] = ['param1', 'param2'];
      const httpParams = new HttpParams();
      const queryParams: QueryParams<any> = {
        include: includeArray as any,
      };

      const httpParamsWithIncludes = service['getIncludeParam'](
        queryParams.include,
        httpParams
      );
      expect(httpParamsWithIncludes.get('include')).toEqual(
        includeArray.join(',')
      );
    });

    it('should return same HttpParams instance when include array is empty or not an array', () => {
      const httpParams = new HttpParams();
      const queryParams: QueryParams<any> = {
        include: [],
      };

      let result = service['getIncludeParam'](queryParams.include, httpParams);
      expect(result).toEqual(httpParams);

      queryParams.include = null as any;
      result = service['getIncludeParam'](queryParams.include, httpParams);
      expect(result).toEqual(httpParams);

      queryParams.include = {} as any;
      result = service['getIncludeParam'](queryParams.include, httpParams);
      expect(result).toEqual(httpParams);
    });
  });
  describe('getSortParam', () => {
    it('should return the HttpParams with the sort parameters', () => {
      let httpParams = new HttpParams();

      const sortParams = {
        target: {
          id: 'ASC',
        },
        relation: {
          name: 'DESC',
        },
      };

      httpParams = service['getSortParam'](sortParams, httpParams);

      expect(httpParams.get('sort')).toBe('id,-relation.name');
    });

    it('should return the HttpParams with the sort parameters when target is empty', () => {
      let httpParams = new HttpParams();

      const sortParams = {
        target: {},
        relation: {
          name: 'DESC',
        },
      };

      httpParams = service['getSortParam'](sortParams, httpParams);

      expect(httpParams.get('sort')).toBe('-relation.name');
    });

    it('should return the HttpParams with sort parameters when target does not exist', () => {
      let httpParams = new HttpParams();

      const sortParams = {
        relation: {
          name: 'DESC',
        },
      };

      httpParams = service['getSortParam'](sortParams, httpParams);

      expect(httpParams.get('sort')).toBe('-relation.name');
    });

    it('should return the original HttpParams when sort is undefined', () => {
      const httpParams = new HttpParams().set('test', 'value');

      const resultParams = service['getSortParam'](undefined, httpParams);

      expect(resultParams.get('sort')).toBeNull();
      expect(resultParams.get('test')).toBe('value');
    });

    it('should return the original HttpParams when sort is an empty object', () => {
      const httpParams = new HttpParams().set('test', 'value');

      const resultParams = service['getSortParam']({}, httpParams);

      expect(resultParams.get('sort')).toBeNull();
      expect(resultParams.get('test')).toBe('value');
    });
  });
  describe('getPageParam', () => {
    it('should return httpParams as it is if page is undefined, not an object, or an empty object', () => {
      const httpParams = new HttpParams();
      let page;
      expect(service['getPageParam'](page, httpParams)).toEqual(httpParams);

      page = 'not an object';
      expect(service['getPageParam'](page as any, httpParams)).toEqual(
        httpParams
      );

      page = {};
      expect(service['getPageParam'](page as any, httpParams)).toEqual(
        httpParams
      );
    });

    it('should set page[number] to 1 if number is not defined in page', () => {
      const httpParams = new HttpParams();
      const page = { size: 50 } as QueryParams<any>['page']; // only size is supplied here
      const result = service['getPageParam'](page, httpParams);
      expect(result.get('page[number]')).toEqual('1');
      expect(result.get('page[size]')).toEqual('50');
    });

    it('should set page[number] and page[size] from page if they are defined', () => {
      const httpParams = new HttpParams();
      const page: QueryParams<any>['page'] = { number: 3, size: 30 };
      const result = service['getPageParam'](page, httpParams);
      expect(result.get('page[number]')).toEqual('3');
      expect(result.get('page[size]')).toEqual('30');
    });

    it('should not set page[size] if it is not defined in page', () => {
      const httpParams = new HttpParams();
      const page = { number: 2 } as QueryParams<any>['page']; // only number is supplied here
      const result = service['getPageParam'](page, httpParams);
      expect(result.get('page[number]')).toEqual('2');
      expect(result.get('page[size]')).toEqual(null);
    });
  });
  describe('getFieldParam', () => {
    it('should return original httpParams when field is empty or not an object', () => {
      const originalParams = new HttpParams();
      const result = service['getFieldParam'](undefined, originalParams);
      expect(result).toEqual(originalParams);
    });

    it('should correctly set httpParams with target field', () => {
      const fields = { target: ['prop1', 'prop2'] };
      const originalParams = new HttpParams();
      const result = service['getFieldParam'](fields as any, originalParams);
      expect(result.get('fields[target]')).toBe('prop1,prop2');
    });

    it('should correctly set httpParams with other fields', () => {
      const fields = { relation: ['prop1', 'prop2'] };
      const originalParams = new HttpParams();
      const result = service['getFieldParam'](fields, originalParams);
      expect(result.get('fields[relation]')).toBe('prop1,prop2');
      expect(result.get('fields[target]')).toBe(null);
    });
  });
  describe('getFilterParam', () => {
    it('should return the same HttpParams when the filter is an empty object', () => {
      const httpParams = new HttpParams();
      const filter = {};

      const result = service['getFilterParam'](filter as any, httpParams);

      expect(result).toEqual(httpParams);
    });

    //It correctly adds parameters to HttpParams from a filter
    it('should correctly add parameters from a simple non-nested filter', () => {
      const httpParams = new HttpParams();
      const filter = { target: { name: { eq: 'John' } } };

      const result = service['getFilterParam'](filter, httpParams);

      expect(result.keys()).toContain('filter[name][eq]');
      expect(result.get('filter[name][eq]')).toEqual('John');
    });

    it('should correctly add array parameters from a simple non-nested filter', () => {
      const httpParams = new HttpParams();
      const filter = { target: { name: { in: ['John', 'Tom'] } } };

      const result = service['getFilterParam'](filter, httpParams);

      expect(result.keys()).toContain('filter[name][in]');
      expect(result.get('filter[name][in]')).toEqual('John,Tom');
    });

    it('should correctly add parameters from a nested filter', () => {
      const httpParams = new HttpParams();
      const filter = { child: { name: { eq: 'John' } } };

      const result = service['getFilterParam'](filter as any, httpParams);

      expect(result.keys()).toContain('filter[child.name][eq]');
      expect(result.get('filter[child.name][eq]')).toEqual('John');
    });

    it('should correctly add array parameters from a nested filter', () => {
      const httpParams = new HttpParams();
      const filter = { child: { name: { in: ['John', 'Tom'] } } };

      const result = service['getFilterParam'](filter as any, httpParams);

      expect(result.keys()).toContain('filter[child.name][in]');
      expect(result.get('filter[child.name][in]')).toEqual('John,Tom');
    });
  });

  describe('createEntityInstance', () => {
    it('Should return instance of entity', () => {
      const entityInstance = service['createEntityInstance']('test') as any;

      expect(typeof entityInstance).toBe('object');
      expect(entityInstance.constructor.name).toBe('Test');

      const entityInstance1 = service['createEntityInstance'](
        'test-test'
      ) as any;

      expect(typeof entityInstance1).toBe('object');
      expect(entityInstance1.constructor.name).toBe('TestTest');
    });
  });

  describe('findIncludeEntity', () => {
    const dummyItem = {
      type: 'testType',
      id: '1',
    } as any;

    it('should return undefined when no matching included item is found', () => {
      const included = [
        {
          id: 'differentId',
          type: 'differentType',
          attributes: {},
        },
      ] as any;

      const result = service['findIncludeEntity'](dummyItem, included);

      expect(result).toBeUndefined();
    });

    it('should return an entity object when matching included item is found without attributes', () => {
      const included = [
        {
          id: '1',
          type: 'testType',
        },
      ] as any;

      const result: any = service['findIncludeEntity'](dummyItem, included);
      expect(result).toBeDefined();
      expect(result[mockJsonApiSdkConfig.idKey] as any).toBe(1);
    });

    it('should return an entity object when matching included item is found with attributes', () => {
      const included = [
        {
          id: '1',
          type: 'testType',
          attributes: { attr1: 'value1', attr2: 'value2' },
        },
      ] as any;

      const result: any = service['findIncludeEntity'](dummyItem, included);

      expect(result).toBeDefined();
      expect(result[mockJsonApiSdkConfig.idKey]).toBe(1);
      expect(result.attr1).toBe('value1');
      expect(result.attr2).toBe('value2');
    });
  });

  describe('Testing convertResponseData function', () => {
    const someData = () => ({
      data: [
        {
          type: 'type1',
          id: '1',
          attributes: {
            attr1: 'value1',
            attr2: 'value2',
          },
          relationships: {
            relationship1: {
              data: {
                type: 'type2',
                id: '2',
              },
            },
          },
        },
      ],
      included: [],
    });

    it('should handle data without include but preserve relationship id', () => {
      const response = service['convertResponseData'](
        someData() as any,
        []
      ) as any;
      expect(response[0].constructor.name).toBe('Type1');
      expect(response[0][mockJsonApiSdkConfig.idKey]).toBe(1);
      expect(response[0]).toHaveProperty('attr1');
      expect(response[0]).toHaveProperty('attr2');
      // Relationship is now preserved with just id (even without include)
      expect(response[0]).toHaveProperty('relationship1');
      expect(response[0]['relationship1'][mockJsonApiSdkConfig.idKey]).toBe(2);
      expect(response[0]['relationship1'].constructor.name).toBe('Type2');
      // But no attributes since it wasn't in included
      expect(response[0]['relationship1']).not.toHaveProperty('attr1');
    });
    it('should handle data with existing relationships', () => {
      const data = {
        ...someData(),
        included: [
          {
            type: 'type2',
            id: '2',
            attributes: {
              attr1: 'value1',
              attr2: 'value2',
            },
          },
        ],
      } as any;
      const response = service['convertResponseData'](data, [
        'relationship1',
      ] as any) as any;
      expect(response[0].constructor.name).toBe('Type1');
      expect(response[0][mockJsonApiSdkConfig.idKey]).toBe(1);
      expect(response[0]).toHaveProperty('attr1');
      expect(response[0]).toHaveProperty('attr2');
      expect(response[0]).toHaveProperty('relationship1');
      expect(response[0]['relationship1'][mockJsonApiSdkConfig.idKey]).toBe(2);
    });

    it('should handle array relationships without include', () => {
      const data = {
        data: [
          {
            type: 'users',
            id: '1',
            attributes: { name: 'John' },
            relationships: {
              roles: {
                data: [
                  { type: 'roles', id: '10' },
                  { type: 'roles', id: '20' },
                ],
              },
            },
          },
        ],
        included: [],
      } as any;
      const response = service['convertResponseData'](data, []) as any;
      expect(response[0]).toHaveProperty('roles');
      expect(response[0]['roles']).toHaveLength(2);
      expect(response[0]['roles'][0][mockJsonApiSdkConfig.idKey]).toBe(10);
      expect(response[0]['roles'][1][mockJsonApiSdkConfig.idKey]).toBe(20);
      expect(response[0]['roles'][0].constructor.name).toBe('Roles');
    });

    it('should skip null relationship data', () => {
      const data = {
        data: [
          {
            type: 'comments',
            id: '1',
            attributes: { text: 'hello' },
            relationships: {
              createdBy: {
                data: null,
              },
            },
          },
        ],
        included: [],
      } as any;

      const tmp = {
        meta: {
          time: 27.92083299998194,
        },
        data: {
          id: '019c0ecd-3a59-725a-bb19-06c8c810551e',
          type: 'users',
          attributes: {
            createdAt: '2026-01-30T12:07:37.000Z',
            updatedAt: '2026-01-30T18:08:53.004Z',
            deletedAt: null,
            email: 'klerick666@gmail.com',
            verifiedEmail: false,
            username: 'klerick',
            firstName: 'Alex',
            lastName: 'H',
            displayName: 'Alex H',
          },
          links: {
            self: '/api/users/019c0ecd-3a59-725a-bb19-06c8c810551e',
          },
          relationships: {
            role: {
              links: {
                self: '/api/users/019c0ecd-3a59-725a-bb19-06c8c810551e/relationships/role',
              },
              data: {
                id: 'free_user',
                type: 'roles',
              },
            },
            providers: {
              links: {
                self: '/api/users/019c0ecd-3a59-725a-bb19-06c8c810551e/relationships/providers',
              },
              data: [
                {
                  id: '019c100a-5aff-7124-9b8c-5cc521263ba2',
                  type: 'user-providers',
                },
                {
                  id: '019c100a-7e76-7028-af09-0a8322ba4275',
                  type: 'user-providers',
                },
              ],
            },
          },
        },
        included: [
          {
            id: '019c100a-5aff-7124-9b8c-5cc521263ba2',
            type: 'user-providers',
            attributes: {
              createdAt: '2026-01-30T17:54:00.000Z',
              provider: 'github',
              profileId: '1661581',
              email: 'klerick666@gmail.com',
              displayName: null,
            },
            links: {
              self: '/api/user-providers/019c100a-5aff-7124-9b8c-5cc521263ba2',
            },
            relationships: {
              user: {
                links: {
                  self: '/api/user-providers/019c100a-5aff-7124-9b8c-5cc521263ba2/relationships/user',
                },
              },
            },
          },
          {
            id: '019c100a-7e76-7028-af09-0a8322ba4275',
            type: 'user-providers',
            attributes: {
              createdAt: '2026-01-30T17:54:09.000Z',
              provider: 'google',
              profileId: '118084993756780491993',
              email: 'klerick666@gmail.com',
              displayName: null,
            },
            links: {
              self: '/api/user-providers/019c100a-7e76-7028-af09-0a8322ba4275',
            },
            relationships: {
              user: {
                links: {
                  self: '/api/user-providers/019c100a-7e76-7028-af09-0a8322ba4275/relationships/user',
                },
              },
            },
          },
        ],
      };

      const response = service['convertResponseData'](data, []) as any;
      expect(response[0]).not.toHaveProperty('createdBy');
    });

    it('should return plain objects when asPlain is true', () => {
      const response = service['convertResponseData'](
        someData() as any,
        [],
        true
      ) as any;
      expect(response[0].constructor.name).toBe('Object');
      expect(response[0][mockJsonApiSdkConfig.idKey]).toBe(1);
      expect(response[0]).toHaveProperty('relationship1');
      expect(response[0]['relationship1'].constructor.name).toBe('Object');
    });
  });

  it('should generate body correctly', () => {
    class TestEntity {
      id = '1';
      name = 'Test';
      name1 = true;
      name2 = 1;
      name3 = null;
      relatedEntity = new (class RelatedEntity {
        id = '2';
        type = 'relatedEntity';
      })();
      relatedEntities = [
        new (class RelatedEntities {
          id = '3';
          type = 'relatedEntities';
        })(),
      ];
    }

    const testEntity = new TestEntity();
    const result = service.generateBody(testEntity);

    expect(result).toEqual({
      attributes: {
        name: 'Test',
        name1: true,
        name2: 1,
        name3: null,
      },
      relationships: {
        relatedEntity: {
          data: {
            type: 'related-entity',
            id: '2',
          },
        },
        relatedEntities: {
          data: [
            {
              type: 'related-entities',
              id: '3',
            },
          ],
        },
      },
    });
  });

  it('should get result for array relation correctly', () => {
    const body = [
      { id: '1', type: 'test' },
      { id: '2', type: 'test' },
    ] as any;
    const result = service['getResultForRelation']({ data: body } as any);
    expect(result).toEqual([body[0].id, body[1].id]);
  });

  it('should get result for relation correctly', () => {
    const body = { id: '1', type: 'test' } as any;
    const result = service['getResultForRelation']({ data: body } as any);
    expect(result).toEqual(body.id);
  });

  it('should generate relationships body correctly', () => {
    class TestEntity {
      id = '1';
      type = 'Test';
    }

    const testEntity = new TestEntity();
    const result = service.generateRelationshipsBody(testEntity);

    expect(result).toEqual({
      id: testEntity.id,
      type: 'test-entity',
    });
  });

  it('should generate relationships body correctly', () => {
    class TestEntity {
      id = '1';
      type = 'Test';
    }

    const testEntity = new TestEntity();
    const result = service.generateRelationshipsBody([testEntity]);

    expect(result).toEqual([
      {
        id: testEntity.id,
        type: 'test-entity',
      },
    ]);
  });

  describe('generateBody with nullRef and emptyArrayRef', () => {
    it('should handle nullRef for single relationship', async () => {
      const { nullRef } = await import('../utils');

      class TestEntity {
        id = '1';
        name = 'Test';
        manager: null = nullRef();
      }

      const testEntity = new TestEntity();
      const result = service.generateBody(testEntity);

      expect(result).toEqual({
        attributes: {
          name: 'Test',
        },
        relationships: {
          manager: {
            data: null,
          },
        },
      });
    });

    it('should handle emptyArrayRef for to-many relationship', async () => {
      const { emptyArrayRef } = await import('../utils');

      class TestEntity {
        id = '1';
        name = 'Test';
        roles: unknown[] = emptyArrayRef();
      }

      const testEntity = new TestEntity();
      const result = service.generateBody(testEntity);

      expect(result).toEqual({
        attributes: {
          name: 'Test',
        },
        relationships: {
          roles: {
            data: [],
          },
        },
      });
    });
  });
});
