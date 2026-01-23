import { Observable } from 'rxjs';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';

import { ReturnIfArray } from './utils';

/**
 * Chainable entity methods returning Observable
 * @param E - Input entity type (for request body)
 * @param OutputE - Output entity type (for response), defaults to E
 * @param IdKey - ID field key, defaults to 'id'
 */
export interface EntityChain<
  E extends object,
  OutputE extends E = E,
  IdKey extends string = 'id'
> {
  postOne(): Observable<OutputE>;
  patchOne(): Observable<OutputE>;
  deleteOne(): Observable<void>;
  getRelationships<Rel extends RelationKeys<E, IdKey>>(
    relationType: Rel
  ): Observable<ReturnIfArray<E[Rel], string>>;
  patchRelationships<Rel extends RelationKeys<E, IdKey>>(
    relationType: Rel
  ): Observable<ReturnIfArray<E[Rel], string>>;
  postRelationships<Rel extends RelationKeys<E, IdKey>>(
    relationType: Rel
  ): Observable<ReturnIfArray<E[Rel], string>>;
  deleteRelationships<Rel extends RelationKeys<E, IdKey>>(
    relationType: Rel
  ): Observable<void>;
}

/**
 * Converts Observable<T> to Promise<T>
 */
type ToPromise<T> = T extends Observable<infer U> ? Promise<U> : T;

/**
 * EntityChain with Promise return types (derived automatically)
 * @param E - Input entity type (for request body)
 * @param OutputE - Output entity type (for response), defaults to E
 * @param IdKey - ID field key, defaults to 'id'
 */
export type PromiseEntityChain<
  E extends object,
  OutputE extends E = E,
  IdKey extends string = 'id'
> = {
  [K in keyof EntityChain<E, OutputE, IdKey>]: EntityChain<
    E,
    OutputE,
    IdKey
  >[K] extends (...args: infer A) => infer R
    ? (...args: A) => ToPromise<R>
    : never;
};
