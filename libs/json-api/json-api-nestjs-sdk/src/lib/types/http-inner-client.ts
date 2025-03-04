import { Observable } from 'rxjs';
import {
  RelationKeys,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';

import { ParamObject } from '../utils';
import { PostData, PatchData, RelationBodyData } from './http-request-params';
import { AtomicBody, AtomicResponse } from './atomic-type';

export interface HttpInnerClient {
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

  delete(
    url: string,
    body?: RelationBodyData | RelationBodyData[]
  ): Observable<void>;
}
