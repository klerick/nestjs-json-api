import {
  RelationKeys,
  ResourceObject,
  EntityClass,
} from '@klerick/json-api-nestjs-shared';

import { EMPTY, expand, Observable, reduce, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  HttpInnerClient,
  JsonApiSdkConfig,
  PatchData,
  QueryParams,
  QueryParamsForOneItem,
  RelationBodyData,
  ReturnIfArray,
  EntityChain,
} from '../types';
import { EntityArray, getTypeForReq } from '../utils';
import { JsonApiUtilsService } from './json-api-utils.service';

const AS_PLAIN_RESULT = Symbol('asPlainResult');

export class JsonApiSdkService {
  constructor(
    private http: HttpInnerClient,
    private jsonApiUtilsService: JsonApiUtilsService,
    private jsonApiSdkConfig: JsonApiSdkConfig
  ) {}

  public entity<E extends object, OutputE extends E = E>(
    typeName: string,
    data: E
  ): EntityChain<E, OutputE>;
  public entity<E extends object>(typeName: string, data: E, raw: true): E;
  public entity<E extends object, OutputE extends E = E>(
    typeName: string,
    data: E,
    raw?: boolean
  ): EntityChain<E, OutputE> | E {
    const instance = this.jsonApiUtilsService.createEntityInstance<E>(typeName);
    const entityObj = Object.assign(instance, data);

    if (raw) return entityObj;

    // Mark for plain result when used via chain
    Reflect.set(entityObj, AS_PLAIN_RESULT, true);

    return new Proxy(this, {
      get: (target, method: string) => {
        const fn = (target as any)[method];
        if (typeof fn === 'function') {
          return (...args: unknown[]) => fn.call(target, entityObj, ...args);
        }
        return fn;
      },
    }) as unknown as EntityChain<E, OutputE>;
  }

  public getList<Entity extends object, IdKey extends string = 'id'>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>>;
  public getList<Entity extends object, IdKey extends string = 'id'>(
    typeName: string,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>>;
  public getList<Entity extends object, IdKey extends string = 'id'>(
    entityOrTypeName: EntityClass<Entity> | string,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>> {
    const asPlain = typeof entityOrTypeName === 'string';
    const name = asPlain ? entityOrTypeName : entityOrTypeName.name;
    const query = this.jsonApiUtilsService.getQueryStringParams(params);

    return this.http
      .get<Entity, 'array', IdKey>(
        this.jsonApiUtilsService.getUrlForResource(name),
        {
          params: query.toObject(),
        }
      )
      .pipe(
        map<ResourceObject<Entity, 'array', null, IdKey>, EntityArray<Entity>>(
          (result) => {
            const resource = params
              ? this.jsonApiUtilsService.convertResponseData(
                  result,
                  params.include,
                  asPlain
                )
              : this.jsonApiUtilsService.convertResponseData(
                  result,
                  undefined,
                  asPlain
                );
            const { totalItems, pageSize, pageNumber } = Object.assign(
              {
                totalItems: 0,
                pageNumber: 0,
                pageSize: 0,
              },
              result.meta
            );

            return new EntityArray<Entity>(resource, {
              totalItems,
              pageNumber,
              pageSize,
            });
          }
        )
      );
  }

  getAll<Entity extends object>(
    entity: EntityClass<Entity>,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Observable<EntityArray<Entity>>;
  getAll<Entity extends object>(
    typeName: string,
    params?: QueryParams<Entity>,
    push?: boolean
  ): Observable<EntityArray<Entity>>;
  getAll<Entity extends object>(
    entityOrTypeName: EntityClass<Entity> | string,
    params?: QueryParams<Entity>,
    push = true
  ): Observable<EntityArray<Entity>> {
    const request = this.getList<Entity>(entityOrTypeName as any, params).pipe(
      expand((r) => {
        if (r.pageNumber * r.pageSize >= r.totalItems) {
          return EMPTY;
        }
        const newParams = {
          ...params,
          ...{
            page: {
              number: r.pageNumber + 1,
              size: r.pageSize,
            },
          },
        };
        return this.getList<Entity>(entityOrTypeName as any, newParams);
      })
    );

    if (!push) {
      return request.pipe(
        reduce<Entity[]>((acum, item) => {
          if (!acum && !Array.isArray(acum)) {
            acum = [];
          }
          acum.push(...item);
          return acum;
        }),
        map(
          (r) =>
            new EntityArray<Entity>(r, {
              pageSize: r.length,
              pageNumber: 1,
              totalItems: r.length,
            })
        )
      );
    }

    return request;
  }

  getOne<Entity extends object>(
    entity: EntityClass<Entity>,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Observable<Entity>;
  getOne<Entity extends object>(
    typeName: string,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Observable<Entity>;
  getOne<Entity extends object>(
    entityOrTypeName: EntityClass<Entity> | string,
    id: string | number,
    params?: QueryParamsForOneItem<Entity>
  ): Observable<Entity> {
    if (!id) {
      return throwError(() => new Error('Id for resource is required'));
    }

    const asPlain = typeof entityOrTypeName === 'string';
    const name = asPlain ? entityOrTypeName : entityOrTypeName.name;
    const query = this.jsonApiUtilsService.getQueryStringParams(params);

    return this.http
      .get<Entity>(
        `${this.jsonApiUtilsService.getUrlForResource(name)}/${id}`,
        {
          params: query.toObject(),
        }
      )
      .pipe(
        map((result) =>
          this.jsonApiUtilsService.convertResponseData(
            result,
            params?.include,
            asPlain
          )
        )
      );
  }

  public postOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity,
    meta?: Record<string, unknown>
  ): Observable<OutputEntity> {
    const asPlain = Reflect.has(entity, AS_PLAIN_RESULT);
    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);

    const body = {
      data: {
        type: getTypeForReq(entity.constructor.name),
        attributes,
        ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
      },
      ...(meta ? { meta } : {}),
    };
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (id) {
      Reflect.set(body.data, 'id', String(id));
    }

    return this.http
      .post<Entity>(
        this.jsonApiUtilsService.getUrlForResource(entity.constructor.name),
        body
      )
      .pipe(
        map(
          (r) =>
            this.jsonApiUtilsService.convertResponseData(
              r,
              (Object.keys(relationships).length > 0 ? Object.keys(relationships) : undefined) as any,
              asPlain
            ) as OutputEntity
        )
      );
  }

  public patchOne<Entity extends object, OutputEntity extends Entity = Entity>(
    entity: Entity,
    meta?: Record<string, unknown>
  ): Observable<OutputEntity> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const asPlain = Reflect.has(entity, AS_PLAIN_RESULT);
    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);

    const body = {
      data: {
        id: String(id),
        type: getTypeForReq(entity.constructor.name),
      },
      ...(meta ? { meta } : {}),
    } satisfies PatchData<Entity>;

    if (Object.keys(relationships).length > 0) {
      Reflect.set(body.data, 'relationships', relationships);
    }

    if (attributes && Object.keys(attributes).length > 0) {
      Reflect.set(body.data, 'attributes', attributes);
    }

    return this.http
      .patch<Entity>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${id}`,
        body
      )
      .pipe(
        map(
          (r) =>
            this.jsonApiUtilsService.convertResponseData(
              r,
              (Object.keys(relationships).length > 0 ? Object.keys(relationships) : undefined) as any,
              asPlain
            ) as OutputEntity
        )
      );
  }

  public deleteOne<Entity extends object>(entity: Entity): Observable<void> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    return this.http.delete(
      `${this.jsonApiUtilsService.getUrlForResource(
        entity.constructor.name
      )}/${id}`
    );
  }

  public getRelationships<
    Entity extends object,
    IdKey extends string = 'id',
    Rel extends RelationKeys<Entity, IdKey> = RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    return this.http
      .get<Entity, IdKey, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${id}/relationships/${String(relationType)}`
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public patchRelationships<
    Entity extends object,
    IdKey extends string,
    Rel extends RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body: RelationBodyData = {
      data: this.jsonApiUtilsService.generateRelationshipsBody(
        entity[relationType] as object
      ),
      ...(meta ? { meta } : {}),
    };

    return this.http
      .patch<Entity, IdKey, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${id}/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public postRelationships<
    Entity extends object,
    IdKey extends string,
    Rel extends RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Observable<ReturnIfArray<Entity[Rel], string>> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody(
        entity[relationType] as object
      ),
      ...(meta ? { meta } : {}),
    };

    return this.http
      .post<Entity, IdKey, Rel>(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${id}/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map((result) => this.jsonApiUtilsService.getResultForRelation(result))
      );
  }

  public deleteRelationships<
    Entity extends object,
    IdKey extends string,
    Rel extends RelationKeys<Entity, IdKey>
  >(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): Observable<void> {
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);
    if (!id) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    if (entity[relationType] === undefined) {
      return throwError(
        () =>
          new Error(
            `${relationType.toString()} should not be undefined in entity`
          )
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody(
        entity[relationType] as object
      ),
      ...(meta ? { meta } : {}),
    };

    return this.http
      .delete(
        `${this.jsonApiUtilsService.getUrlForResource(
          entity.constructor.name
        )}/${id}/relationships/${String(relationType)}`,
        body
      )
      .pipe(map(() => void 0));
  }
}
