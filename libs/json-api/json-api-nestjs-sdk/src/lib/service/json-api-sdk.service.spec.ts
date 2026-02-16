import { BehaviorSubject, lastValueFrom, of, take } from 'rxjs';
import { JsonApiSdkService } from './json-api-sdk.service';
import { HttpInnerClient, JsonApiSdkConfig } from '../types';
import { JsonApiUtilsService } from './index';
import { EntityArray } from '../utils';
import { FetchInnerClient } from './fetch-inner-client';

function mockResults(mock: any, pageNumber: number) {
  return {
    data: [mock],
    meta: { totalItems: 2, pageSize: 1, pageNumber },
  };
}

describe('JsonApiSdkService', () => {
  let service: JsonApiSdkService;
  let http: HttpInnerClient;
  let jsonApiUtilsService: JsonApiUtilsService;
  const mockJsonApiSdkConfig: JsonApiSdkConfig = {
    apiHost: 'http://localhost:3000',
    apiPrefix: 'api/v1',
    idKey: 'id',
    idIsNumber: true,
    operationUrl: 'operationUrl',
    dateFields: [],
  };

  beforeEach(() => {
    http = new FetchInnerClient();
    jsonApiUtilsService = new JsonApiUtilsService(mockJsonApiSdkConfig);
    service = new JsonApiSdkService(
      http,
      jsonApiUtilsService,
      mockJsonApiSdkConfig
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call getList and return result', async () => {
    const mockResult = {
      data: [
        {
          id: 1,
          type: 'test-class',
          attributes: { a: '1', b: '2', c: '3' },
        },
        {
          id: 2,
          type: 'test-class',
          attributes: { a: '4', b: '5', c: '6' },
        },
      ],
      meta: { totalItems: 2, pageSize: 1, pageNumber: 1 },
    };
    const spyHttpGet = vi.spyOn(http, 'get').mockImplementation(() => {
      return new BehaviorSubject(mockResult).pipe(take(1));
    });
    const spyConvertResponseData = vi
      .spyOn(jsonApiUtilsService, 'convertResponseData')
      .mockReturnValue(mockResult.data);

    const spyGetQueryStringParams = vi.spyOn(
      jsonApiUtilsService,
      'getQueryStringParams'
    );
    const spyGetUrlForResource = vi.spyOn(
      jsonApiUtilsService,
      'getUrlForResource'
    );
    class TestKlass {}
    const stream$ = service.getList(TestKlass);
    const result = await lastValueFrom(stream$);
    expect(result).toEqual(new EntityArray(mockResult.data, mockResult.meta));
    expect(spyGetQueryStringParams).toHaveBeenCalled();
    expect(spyGetUrlForResource).toHaveBeenCalledWith(TestKlass.name);
    expect(spyHttpGet).toHaveBeenCalled();
    expect(spyConvertResponseData).toHaveBeenCalledWith(
      mockResult,
      undefined,
      false,
    );
  });

  it('should call getAll and return result', async () => {
    class TestKlass {}
    const mock1 = {
      id: 1,
      type: 'test-class',
      attributes: { a: '1', b: '2', c: '3' },
    };
    const mock2 = {
      id: 2,
      type: 'test-class',
      attributes: { a: '4', b: '5', c: '6' },
    };

    let callCount = 0;

    const spyHttpGet = vi.spyOn(http, 'get').mockImplementation(() => {
      const result = mockResults(
        callCount === 0 ? mock1 : mock2,
        callCount + 1
      );
      callCount++;
      return new BehaviorSubject(result).pipe(take(1));
    });

    const spyGetList = vi.spyOn(service, 'getList');
    let callCountResult = 0;
    await new Promise((resolve) => {
      service.getAll(TestKlass).subscribe({
        next: (result) => {
          const resultMock = mockResults(
            callCountResult === 0 ? mock1 : mock2,
            callCountResult + 1
          );
          callCountResult++;
          expect(result).toEqual(
            new EntityArray(
              [
                {
                  id: resultMock.data[0].id,
                  ...resultMock.data[0].attributes,
                },
              ],
              resultMock.meta
            )
          );
        },
        complete: () => {
          resolve(void 0);
        },
      });
    });
    expect(spyGetList).toHaveBeenCalledTimes(2);
    expect(spyHttpGet).toHaveBeenCalledTimes(2);
  });

  it('should call getAll with push=false and return result', async () => {
    class TestKlass {}
    const mockResults = [
      {
        data: [{ a: '1', b: '2', c: '3' }],
        meta: { totalItems: 2, pageSize: 1, pageNumber: 1 },
      },
      {
        data: [{ a: '4', b: '5', c: '6' }],
        meta: { totalItems: 2, pageSize: 1, pageNumber: 2 },
      },
    ];
    let callCount = 0;
    vi.spyOn(service, 'getList').mockImplementation(() =>
      of(
        new EntityArray(
          mockResults[callCount].data,
          mockResults[callCount++].meta
        )
      )
    );
    await new Promise((resolve) => {
      service.getAll(TestKlass, undefined, false).subscribe({
        next: (result) => {
          expect(result).toEqual(
            new EntityArray([...mockResults[0].data, ...mockResults[1].data], {
              totalItems: 2,
              pageSize: 2,
              pageNumber: 1,
            })
          );
        },
        complete: () => {
          resolve(void 0);
        },
      });
    });
    expect(service.getList).toHaveBeenCalledTimes(2);
  });

  describe('meta support', () => {
    class Role{
      id?: string;
    }
    class TestEntity {
      id?: number;
      name?: string;
      roles: Role[] = [];
    }

    beforeEach(() => {
      vi.spyOn(jsonApiUtilsService, 'generateBody').mockReturnValue({
        attributes: { name: 'test' },
        relationships: {},
      });

      vi.spyOn(jsonApiUtilsService, 'convertResponseData').mockReturnValue({
        // @ts-expect-error - Mock return value for test
        id: 1,
        name: 'test',
      });
      vi.spyOn(jsonApiUtilsService, 'getUrlForResource').mockReturnValue('/test-entity');
    });

    it('should call postOne with meta and include meta in request body', async () => {
      const entity = new TestEntity();
      entity.name = 'test';
      const meta = { source: 'import', batchId: '123' };
      const mockResponse = {
        data: { id: 1, type: 'test-entity', attributes: { name: 'test' } },
      };

      const spyHttpPost = vi.spyOn(http, 'post').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(service.postOne(entity, meta));

      expect(result).toEqual({ id: 1, name: 'test' });
      expect(spyHttpPost).toHaveBeenCalledWith(
        '/test-entity',
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'test-entity',
            attributes: { name: 'test' },
          }),
          meta: { source: 'import', batchId: '123' },
        })
      );
    });

    it('should call postOne without meta (backward compatibility)', async () => {
      const entity = new TestEntity();
      entity.name = 'test';
      const mockResponse = {
        data: { id: 1, type: 'test-entity', attributes: { name: 'test' } },
      };

      const spyHttpPost = vi.spyOn(http, 'post').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(service.postOne(entity));

      expect(result).toEqual({ id: 1, name: 'test' });
      expect(spyHttpPost).toHaveBeenCalledWith(
        '/test-entity',
        expect.not.objectContaining({
          meta: expect.anything(),
        })
      );
    });

    it('should call patchOne with meta and include meta in request body', async () => {
      const entity = new TestEntity();
      entity.id = 1;
      entity.name = 'updated';
      const meta = { updatedBy: 'admin', reason: 'correction' };
      const mockResponse = {
        data: { id: 1, type: 'test-entity', attributes: { name: 'updated' } },
      };

      const spyHttpPatch = vi.spyOn(http, 'patch').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(service.patchOne(entity, meta));

      expect(result).toEqual({ id: 1, name: 'test' });
      expect(spyHttpPatch).toHaveBeenCalledWith(
        '/test-entity/1',
        expect.objectContaining({
          data: expect.objectContaining({
            id: '1',
            type: 'test-entity',
          }),
          meta: { updatedBy: 'admin', reason: 'correction' },
        })
      );
    });

    it('should call patchOne without meta (backward compatibility)', async () => {
      const entity = new TestEntity();
      entity.id = 1;
      entity.name = 'updated';
      const mockResponse = {
        data: { id: 1, type: 'test-entity', attributes: { name: 'updated' } },
      };

      const spyHttpPatch = vi.spyOn(http, 'patch').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(service.patchOne(entity));

      expect(result).toEqual({ id: 1, name: 'test' });
      expect(spyHttpPatch).toHaveBeenCalledWith(
        '/test-entity/1',
        expect.not.objectContaining({
          meta: expect.anything(),
        })
      );
    });

    it('should call patchRelationships with meta', async () => {
      const entity = new TestEntity();
      entity.id = 1;
      entity.roles = [{ id: '1' }];
      const meta = { addedBy: 'system' };
      const mockResponse = { data: [{ type: 'roles', id: '1' }] };

      vi.spyOn(jsonApiUtilsService, 'generateRelationshipsBody').mockReturnValue([
        { type: 'roles', id: '1' },
      ] as any);
      // @ts-expect-error - Mock return value for test
      vi.spyOn(jsonApiUtilsService, 'getResultForRelation').mockReturnValue(['1']);

      const spyHttpPatch = vi.spyOn(http, 'patch').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(
        (service as any).patchRelationships(entity, 'roles', meta)
      );

      expect(result).toEqual(['1']);
      expect(spyHttpPatch).toHaveBeenCalledWith(
        '/test-entity/1/relationships/roles',
        expect.objectContaining({
          data: [{ type: 'roles', id: '1' }],
          meta: { addedBy: 'system' },
        })
      );
    });

    it('should call postRelationships with meta', async () => {
      const entity = new TestEntity();
      entity.id = 1;
      entity.roles = [{ id: '1' }];
      const meta = { source: 'sync' };
      const mockResponse = { data: [{ type: 'roles', id: '1' }] };

      vi.spyOn(jsonApiUtilsService, 'generateRelationshipsBody').mockReturnValue([
        { type: 'roles', id: '1' },
      ] as any);
      // @ts-expect-error - Mock return value for test
      vi.spyOn(jsonApiUtilsService, 'getResultForRelation').mockReturnValue(['1']);

      const spyHttpPost = vi.spyOn(http, 'post').mockReturnValue(of(mockResponse));

      const result = await lastValueFrom(
        (service as any).postRelationships(entity, 'roles', meta)
      );

      expect(result).toEqual(['1']);
      expect(spyHttpPost).toHaveBeenCalledWith(
        '/test-entity/1/relationships/roles',
        expect.objectContaining({
          data: [{ type: 'roles', id: '1' }],
          meta: { source: 'sync' },
        })
      );
    });

    it('should call deleteRelationships with meta', async () => {
      const entity = new TestEntity();
      entity.id = 1;
      entity.roles = [{ id: '1' }];
      const meta = { deletedBy: 'admin' };

      vi.spyOn(jsonApiUtilsService, 'generateRelationshipsBody').mockReturnValue([
        { type: 'roles', id: '1' },
      ] as any);

      const spyHttpDelete = vi.spyOn(http, 'delete').mockReturnValue(of(void 0));

      await lastValueFrom((service as any).deleteRelationships(entity, 'roles', meta));

      expect(spyHttpDelete).toHaveBeenCalledWith(
        '/test-entity/1/relationships/roles',
        expect.objectContaining({
          data: [{ type: 'roles', id: '1' }],
          meta: { deletedBy: 'admin' },
        })
      );
    });

    it('should call deleteOne without meta parameter', async () => {
      const entity = new TestEntity();
      entity.id = 1;

      const spyHttpDelete = vi.spyOn(http, 'delete').mockReturnValue(of(void 0));

      await lastValueFrom(service.deleteOne(entity));

      // Verify deleteOne is called with URL only, no body
      expect(spyHttpDelete).toHaveBeenCalledWith('/test-entity/1');
      expect(spyHttpDelete).toHaveBeenCalledTimes(1);
      // Ensure it's not called with a second argument (body)
      expect(spyHttpDelete.mock.calls[0]).toHaveLength(1);
    });
  });
});
