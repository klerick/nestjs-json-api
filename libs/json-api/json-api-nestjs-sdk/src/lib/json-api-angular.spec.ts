// Importing the Angular entry point pulls in @angular/common/http, whose
// providers are JIT-compiled when they load outside an AOT build.
import '@angular/compiler';
import { of } from 'rxjs';
import { createHttpInnerClient } from './json-api-angular';

type Call = { verb: string; args: unknown[] };

function fakeHttpClient() {
  const calls: Call[] = [];
  const record =
    (verb: string) =>
    (...args: unknown[]) => {
      calls.push({ verb, args });
      return of({});
    };

  return {
    calls,
    client: {
      get: record('get'),
      post: record('post'),
      patch: record('patch'),
      delete: record('delete'),
    } as never,
  };
}

describe('createHttpInnerClient', () => {
  describe('where the body goes', () => {
    it('sends a delete body the way HttpClient expects it', () => {
      // HttpInnerClient takes the body as the second argument of delete, but
      // HttpClient reads that position as options and carries the body inside
      // them. Handing the body over as-is dropped it from the request.
      const { calls, client } = fakeHttpClient();
      const body = { data: [{ type: 'roles', id: '1' }] };

      createHttpInnerClient(client).delete('/url', body as never);

      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['/url', { body }]);
    });

    it('sends no options at all when delete has no body', () => {
      const { calls, client } = fakeHttpClient();

      createHttpInnerClient(client).delete('/url');

      expect(calls[0].args).toEqual(['/url', undefined]);
    });

    it('leaves the body of post and patch in its own argument', () => {
      const { calls, client } = fakeHttpClient();
      const body = { data: { type: 'users', attributes: {} } };

      createHttpInnerClient(client).post('/url', body as never);
      createHttpInnerClient(client).patch('/url', body as never);

      expect(calls[0].args).toEqual(['/url', body, undefined]);
      expect(calls[1].args).toEqual(['/url', body, undefined]);
    });

    it('passes the query params of get through untouched', () => {
      const { calls, client } = fakeHttpClient();
      const params = { filter: 'x' };

      createHttpInnerClient(client).get('/url', { params } as never);

      expect(calls[0].args).toEqual(['/url', { params }]);
    });
  });
});
