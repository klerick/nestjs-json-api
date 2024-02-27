import { of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { FetchInnerClient } from './fetch-inner-client';

jest.mock('rxjs/fetch');

describe('FetchInnerClient', () => {
  let fetchInnerClient: FetchInnerClient;

  beforeEach(() => {
    fetchInnerClient = new FetchInnerClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('delete', () => {
    it('should call request with correct arguments when body is not provided', () => {
      const url = 'http://test.url';
      const expectedRequestInit: RequestInit = {
        method: 'delete',
      };
      const requestSpy = jest
        .spyOn(fetchInnerClient as any, 'request')
        .mockReturnValue(of(null));

      fetchInnerClient.delete(url);

      expect(requestSpy).toHaveBeenCalledWith(url, expectedRequestInit);
    });

    it('should call request with correct arguments when body is provided', () => {
      const url = 'http://test.url';
      const body = { data: [{ id: '1' }] } as any;
      const expectedRequestInit: RequestInit = {
        method: 'delete',
        body: JSON.stringify(body),
      };

      const requestSpy = jest
        .spyOn(fetchInnerClient as any, 'request')
        .mockReturnValue(of(null)); // Mock request method return

      fetchInnerClient.delete(url, body);

      expect(requestSpy).toHaveBeenCalledWith(url, expectedRequestInit);
    });
  });

  it('should call the request method with the correct URL and method when get is called', () => {
    const expectedURL = 'https://yourtesturl.com/path'; // please update this URL based on your test case
    const expectedParams = { params: { key: 'value' } }; // please update these params based on your test case
    const expectedResult = 'test'; // please update this based on your expect result

    const requestSpy = jest
      .spyOn(fetchInnerClient as any, 'request')
      .mockReturnValue(of(expectedResult));

    fetchInnerClient.get(expectedURL, expectedParams).subscribe((res) => {
      expect(res).toBe(expectedResult);
      expect(requestSpy).toBeCalledWith(
        (fetchInnerClient as any).getResultUrl(
          expectedURL,
          expectedParams.params
        ),
        { method: 'get' }
      );
    });
  });

  it('should call the request method with the correct URL, method and body when patch is called', async () => {
    const expectedURL = 'https://yourtesturl.com/path'; // update this with your own test URL
    const expectedBody = { key: 'value' } as any; // update this with your test body data
    const expectedResult = 'test'; // update this with your expected result

    const requestSpy = jest
      .spyOn(fetchInnerClient as any, 'request')
      .mockReturnValue(of(expectedResult));

    const res = await new Promise((resolve) => {
      fetchInnerClient.patch(expectedURL, expectedBody).subscribe((res) => {
        resolve(res);
      });
    });

    expect(res).toBe(expectedResult);
    expect(requestSpy).toBeCalledWith(expectedURL, {
      method: 'patch',
      body: JSON.stringify(expectedBody),
    });
  });

  it('should call the request method with the correct URL, method and body when post is called', (done) => {
    const expectedURL = 'https://yourtesturl.com/path'; // update this with your test URL
    const expectedBody = { key: 'value' } as any; // update this with your test body data
    const expectedResult = 'test'; // update this with your expected result

    const requestSpy = jest
      .spyOn(fetchInnerClient as any, 'request')
      .mockReturnValue(of(expectedResult));

    fetchInnerClient.post(expectedURL, expectedBody).subscribe({
      next: (res) => {
        expect(res).toBe(expectedResult);
      },
      complete: () => {
        expect(requestSpy).toBeCalledWith(expectedURL, {
          method: 'post',
          body: JSON.stringify(expectedBody),
        });
        done();
      },
    });
  });

  it('should correctly call fromFetch function with the provided url and request data when request is called', (done) => {
    const expectedURL = 'https://yourtesturl.com/path'; // update with your test URL
    const expectedInitData: RequestInit = { method: 'get' }; // update with your test request data

    const mockResponse = { json: jest.fn() }; // a mock response object, modify as needed.

    (fromFetch as jest.Mock).mockReturnValue(of(mockResponse));

    const observable = (fetchInnerClient as any).request(
      expectedURL,
      expectedInitData
    );

    observable.subscribe({
      complete: () => {
        expect(fromFetch).toHaveBeenCalledWith(expectedURL, {
          ...expectedInitData,
          selector: expect.any(Function),
        });
        done();
      },
    });
  });

  it('should correctly modify the url with the provided params when get is called', () => {
    const expectedURL = 'https://yourtesturl.com/path'; // update this with your test URL
    const params = {
      'params[key1]': 'value1',
      'params[key2]': 'value2',
    } as any; // update these with params for your test case

    const result = fetchInnerClient['getResultUrl'](expectedURL, params);
    expect(result).toBe(
      expectedURL + '?params%5Bkey1%5D=value1&params%5Bkey2%5D=value2'
    );
    const result1 = fetchInnerClient['getResultUrl'](expectedURL, {});
    expect(result1).toBe(expectedURL);
  });
});
