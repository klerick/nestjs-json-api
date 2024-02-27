import { Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { ParamObject, HttpParams } from '../utils';
import {
  HttpInnerClient,
  RelationBodyData,
  PostData,
  PatchData,
  ResourceObject,
  AtomicBody,
  EntityRelation,
  ResourceObjectRelationships,
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

  get<T, R extends 'object' | 'array' = 'object'>(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObject<T, R>> {
    let filterParams = {};
    if (params) {
      ({ params: filterParams } = params);
    }
    return this.request<ResourceObject<T, R>>(
      this.getResultUrl(url, filterParams),
      {
        method: 'get',
      }
    );
  }

  patch<T>(url: string, body: PatchData<T>): Observable<ResourceObject<T>>;
  patch<T, Rel extends EntityRelation<T>>(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, Rel>>;
  patch<T, Rel extends EntityRelation<T>>(
    url: string,
    body: PatchData<T> | RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObject<T> | ResourceObjectRelationships<T, Rel>> {
    return this.request<
      ResourceObject<T> | ResourceObjectRelationships<T, Rel>
    >(url, {
      method: 'patch',
      body: JSON.stringify(body),
    });
  }

  post<T>(url: string, body: PostData<T>): Observable<ResourceObject<T>>;
  post<T extends unknown[]>(
    url: string,
    body: AtomicBody
  ): Observable<AtomicResponse<T>>;
  post<T, Rel extends EntityRelation<T>>(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, Rel>>;
  post<T extends [], Rel extends EntityRelation<T>>(
    url: string,
    body: RelationBodyData | RelationBodyData[] | PostData<T> | AtomicBody
  ): Observable<
    ResourceObject<T> | ResourceObjectRelationships<T, Rel> | AtomicResponse<T>
  > {
    return this.request<
      ResourceObject<T> | ResourceObjectRelationships<T, Rel>
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
