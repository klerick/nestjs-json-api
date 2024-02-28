import { BehaviorSubject, of, take } from 'rxjs';
import { JsonApiSdkService } from './json-api-sdk.service';
import { HttpInnerClient, JsonApiSdkConfig } from '../types';
import { JsonApiUtilsService } from './';
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
    jest.clearAllMocks();
  });

  it('should call getList and return result', (done) => {
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
    const spyHttpGet = jest.spyOn(http, 'get').mockImplementation(() => {
      return new BehaviorSubject(mockResult).pipe(take(1));
    });
    const spyConvertResponseData = jest
      .spyOn(jsonApiUtilsService, 'convertResponseData')
      .mockReturnValue(mockResult.data);

    const spyGetQueryStringParams = jest.spyOn(
      jsonApiUtilsService,
      'getQueryStringParams'
    );
    const spyGetUrlForResource = jest.spyOn(
      jsonApiUtilsService,
      'getUrlForResource'
    );
    class TestKlass {}
    service.getList(TestKlass).subscribe({
      next: (result) => {
        expect(result).toEqual(
          new EntityArray(mockResult.data, mockResult.meta)
        );
      },
      complete: () => {
        expect(spyGetQueryStringParams).toHaveBeenCalled();
        expect(spyGetUrlForResource).toHaveBeenCalledWith(TestKlass.name);
        expect(spyHttpGet).toHaveBeenCalled();
        expect(spyConvertResponseData).toHaveBeenCalledWith(mockResult);
        done();
      },
    });
  });

  it('should call getAll and return result', (done) => {
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

    const spyHttpGet = jest.spyOn(http, 'get').mockImplementation(() => {
      const result = mockResults(
        callCount === 0 ? mock1 : mock2,
        callCount + 1
      );
      callCount++;
      return new BehaviorSubject(result).pipe(take(1));
    });

    const spyGetList = jest.spyOn(service, 'getList');
    let callCountResult = 0;
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
        expect(spyGetList).toHaveBeenCalledTimes(2);
        expect(spyHttpGet).toHaveBeenCalledTimes(2);
        done();
      },
    });
  });

  it('should call getAll with push=false and return result', (done) => {
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
    jest
      .spyOn(service, 'getList')
      .mockImplementation(() =>
        of(
          new EntityArray(
            mockResults[callCount].data,
            mockResults[callCount++].meta
          )
        )
      );

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
        expect(service.getList).toHaveBeenCalledTimes(2);
        done();
      },
    });
  });
});
