import { Observable } from 'rxjs';

import { ParamObject } from '../utils';
import { ResourceObject, ResourceObjectRelationships } from './response-body';
import { EntityRelation } from './entity';
import {
  AtomicBody,
  AtomicResponse,
  PatchData,
  PostData,
  RelationBodyData,
} from './index';

export interface HttpInnerClient {
  get<T, R extends 'object' | 'array' = 'object'>(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObject<T, R>>;
  get<T, Rel extends EntityRelation<T>>(
    url: string,
    params?: { params: ParamObject }
  ): Observable<ResourceObjectRelationships<T, Rel>>;

  post<T>(url: string, body: PostData<T>): Observable<ResourceObject<T>>;
  post<T extends unknown[]>(
    url: string,
    body: AtomicBody
  ): Observable<AtomicResponse<T>>;
  post<T, Rel extends EntityRelation<T>>(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, Rel>>;

  patch<T>(url: string, body: PatchData<T>): Observable<ResourceObject<T>>;
  patch<T, Rel extends EntityRelation<T>>(
    url: string,
    body: RelationBodyData | RelationBodyData[]
  ): Observable<ResourceObjectRelationships<T, Rel>>;

  delete(
    url: string,
    body?: RelationBodyData | RelationBodyData[]
  ): Observable<void>;
}
