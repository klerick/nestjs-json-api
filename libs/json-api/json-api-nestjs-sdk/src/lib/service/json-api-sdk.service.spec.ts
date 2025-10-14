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
    expect(spyConvertResponseData).toHaveBeenCalledWith(mockResult);
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
});
