import {
  RelationKeys,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { Axios, AxiosResponse, Method } from 'axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AtomicBody,
  AtomicResponse,
  HttpInnerClient,
  PatchData,
  PostData,
  RelationBodyData,
} from '../types';
import { ParamObject } from './http-params';

class AxiosHttpClient implements HttpInnerClient {
  constructor(private axios: Axios) {}

  private observify<T, R extends AxiosResponse<T>>(
    makeRequest: () => Promise<R>,
    controller: AbortController
  ): Observable<R> {
    return new Observable((subscriber) => {
      makeRequest()
        .then((response) => subscriber.next(response))
        .catch((error: unknown) => subscriber.error(error))
        .finally(() => subscriber.complete());

      return { unsubscribe: () => controller.abort() };
    });
  }

  private makeCancellable(): {
    controller: AbortController;
    signal: AbortSignal;
  } {
    const controller = new AbortController();
    const signal = controller.signal;

    return {
      controller,
      signal,
    };
  }

  delete(
    url: string,
    body?: RelationBodyData | RelationBodyData[]
  ): Observable<void> {
    if (body) {
      return this.request(url, 'DELETE', body);
    }
    return this.request(url, 'DELETE');
  }

  get<T extends object, R extends 'object' | 'array' = 'object'>(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObject<T, R>>;
  get<
    T extends object,
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>
  >(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObjectRelationships<T, IdKey, Rel>>;
  get<
    T extends object,
    R,
    IdKey extends string = string,
    A = R extends RelationKeys<T, IdKey>
      ? ResourceObjectRelationships<T, IdKey, R>
      : never,
    B = R extends 'object' | 'array' ? ResourceObject<T, R> : never
  >(url: string, params?: { params: ParamObject }): Observable<A | B> {
    return this.request<undefined, A | B>(
      url,
      'GET',
      undefined,
      params ? params.params : undefined
    );
  }

  patch<T extends object>(
    url: string,
    body: PatchData<T>
  ): Observable<ResourceObject<T>>;
  patch<
    T extends object,
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>
  >(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, IdKey, Rel>>;
  patch<
    T extends object,
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>
  >(
    url: string,
    body: PatchData<T> | RelationBodyData | RelationBodyData[]
  ): Observable<
    ResourceObject<T> | ResourceObjectRelationships<T, IdKey, Rel>
  > {
    return this.request(url, 'PATCH', body);
  }

  post<T extends object>(
    url: string,
    body: PostData<T>
  ): Observable<ResourceObject<T>>;
  post<T extends unknown[]>(
    url: string,
    body: AtomicBody
  ): Observable<AtomicResponse<T>>;
  post<
    T extends object,
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>
  >(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, IdKey, Rel>>;
  post<T extends [], IdKey extends string, Rel extends RelationKeys<T, IdKey>>(
    url: string,
    body: RelationBodyData | RelationBodyData[] | PostData<T> | AtomicBody
  ): Observable<
    | ResourceObject<T>
    | ResourceObjectRelationships<T, IdKey, Rel>
    | AtomicResponse<T>
  > {
    return this.request<
      RelationBodyData | RelationBodyData[] | PostData<T> | AtomicBody,
      | ResourceObject<T>
      | ResourceObjectRelationships<T, IdKey, Rel>
      | AtomicResponse<T>
    >(url, 'POST', body);
  }

  private request<D, R>(
    url: string,
    method: Method,
    data?: D,
    params?: ParamObject
  ) {
    const { controller, signal } = this.makeCancellable();
    return this.observify(
      () =>
        this.axios.request<R, AxiosResponse<R, D>, D>({
          url,
          method,
          data,
          signal,
          params,
        }),
      controller
    ).pipe(map((r) => r.data));
  }
}

export function adapterForAxios(axios: Axios): HttpInnerClient {
  return new AxiosHttpClient(axios);
}
