import { Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  ResourceObject,
  RelationKeys,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { ParamObject, HttpParams } from '../utils';

import {
  HttpInnerClient,
  PatchData,
  PostData,
  RelationBodyData,
  AtomicBody,
  AtomicResponse,
} from '../types';

export class FetchInnerClient implements HttpInnerClient {
  delete(
    url: string,
    body?: RelationBodyData | RelationBodyData[]
  ): Observable<void> {
    let requestInit: RequestInit = {
      method: 'delete',
    };
    if (body) {
      requestInit = {
        ...requestInit,
        body: JSON.stringify(body),
      };
    }
    return this.request<void>(url, requestInit);
  }

  get<
    T extends object,
    R extends 'object' | 'array' = 'object',
    IdKey extends string = string
  >(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObject<T, R, null, IdKey>>;
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
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>,
    R extends 'object' | 'array' = 'object'
  >(
    url: string,
    params?: { params: ParamObject }
  ): Observable<
    | ResourceObjectRelationships<T, IdKey, Rel>
    | ResourceObject<T, R, null, IdKey>
  > {
    let filterParams = {};
    if (params) {
      ({ params: filterParams } = params);
    }
    return this.request<
      | ResourceObject<T, R, null, IdKey>
      | ResourceObjectRelationships<T, IdKey, Rel>
    >(this.getResultUrl(url, filterParams), {
      method: 'get',
    });
  }

  patch<T extends object>(
    url: string,
    body: PatchData<T>
  ): Observable<ResourceObject<T, 'object'>>;
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
    return this.request<
      ResourceObject<T> | ResourceObjectRelationships<T, IdKey, Rel>
    >(url, {
      method: 'patch',
      body: JSON.stringify(body),
    });
  }

  post<T extends object>(
    url: string,
    body: PostData<T>
  ): Observable<ResourceObject<T>>;
  post<T extends object[]>(
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
  post<
    T extends object | object[],
    IdKey extends string,
    Rel extends RelationKeys<T, IdKey>
  >(
    url: string,
    body: RelationBodyData | RelationBodyData[] | PostData<T> | AtomicBody
  ): Observable<
    | ResourceObject<T>
    | ResourceObjectRelationships<T, IdKey, Rel>
    | AtomicResponse<T extends object[] ? T : [T]>
  > {
    return this.request<

        | ResourceObject<T>
        | ResourceObjectRelationships<T, IdKey, Rel>
        | T extends object[]
        ? AtomicResponse<T extends object[] ? T : [T]>
        : never
    >(url, {
      method: 'post',
      body: JSON.stringify(body),
    });
  }

  private request<T>(url: string, initData: RequestInit): Observable<T> {
    return fromFetch<T>(url, {
      ...initData,
      selector: (r) => r.json(),
    });
  }

  private getResultUrl(url: string, params: ParamObject): string {
    const paramsStr = new HttpParams({ fromObject: params }).toString();
    if (paramsStr.length === 0) return url;
    return new URL(
      '?' + new HttpParams({ fromObject: params }).toString(),
      url
    ).toString();
  }
}
