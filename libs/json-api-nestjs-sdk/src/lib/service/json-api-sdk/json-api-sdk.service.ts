import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ObjectLiteral, ObjectType } from 'typeorm/browser';
import {
  ResourceObject,
  Meta,
  EntityRelation,
  Relationship,
} from 'json-api-nestjs';
import { EMPTY, expand, map, Observable, reduce, throwError } from 'rxjs';

import { EntityArray, getTypeForReq } from '../../utils';
import { QueryParams, QueryParamsForOneItem } from '../../types';

import { JsonApiUtilsService } from '../json-api-utils/json-api-utils.service';

@Injectable({
  providedIn: 'root',
})
export class JsonApiSdkService {
  protected http = inject<HttpClient>(HttpClient);
  protected jsonApiUtilsService =
    inject<JsonApiUtilsService>(JsonApiUtilsService);

  protected getList<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>> {
    const query = this.jsonApiUtilsService.getQueryStringParams<Entity>(params);

    return this.http
      .get<ResourceObject<Entity>>(
        this.jsonApiUtilsService.getUrlForResource(resource.name),
        {
          params: query,
        }
      )
      .pipe(
        map<ResourceObject<Entity>, EntityArray<Entity>>((result) => {
          const resource = this.jsonApiUtilsService.convertResponseData<Entity>(
            result,
            (params || {}).include
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
        })
      );
  }

  getAll<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params: QueryParams<Entity> = {},
    forAllPage: boolean = false
  ): Observable<EntityArray<Entity>> {
    if (!forAllPage) {
      return this.getList(resource, params);
    }
    return this.getList(resource, params).pipe(
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
        return this.getList(resource, newParams);
      }),
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

  public getOne<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    id: string | number
  ): Observable<Entity>;
  public getOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    resource: ObjectType<Entity>,
    id: string | number,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: MetaData }>;
  public getOne<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    id: string | number,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public getOne<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>
  ): Observable<Entity>;
  public getOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: MetaData }>;
  public getOne<Entity extends ObjectLiteral>(
    entity: ObjectType<Entity>,
    id: string | number,
    params: QueryParamsForOneItem<Entity>,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public getOne<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    id: string | number,
    params?: any,
    returnMeta?: any
  ): Observable<Entity | { entity: Entity; meta: Partial<Meta> }> {
    if (!id) {
      return throwError(() => new Error('Id for resource is required'));
    }

    if (typeof params == 'boolean') {
      returnMeta = params;
      params = {};
    } else {
      returnMeta = !!returnMeta;
    }

    const entityName = resource.name;
    const query = this.jsonApiUtilsService.getQueryStringParams(params);
    return this.http
      .get<ResourceObject<Entity>>(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${id}`,
        {
          params: query,
        }
      )
      .pipe(
        map((result) => {
          const entity = this.jsonApiUtilsService.convertResponseData(
            result,
            params?.include
          )[0];
          if (returnMeta) {
            const { meta } = result;
            return {
              entity,
              meta: meta || {},
            };
          }
          return entity;
        })
      );
  }

  public postOne<Entity extends ObjectLiteral>(
    entity: Entity
  ): Observable<Entity>;
  public postOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public postOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: MetaData }>;
  public postOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta?: boolean
  ): Observable<Entity | { entity: Entity; meta: Partial<Meta> }> {
    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);
    const body = {
      data: {
        type: getTypeForReq(entity.constructor.name),
        attributes,
        relationships,
      },
    };

    const entityName = entity.constructor.name;
    return this.http
      .post<ResourceObject<Entity>>(
        this.jsonApiUtilsService.getUrlForResource(entityName),
        body
      )
      .pipe(
        map((jsonApiResult) => ({
          meta: jsonApiResult.meta || {},
          resourceItem:
            this.jsonApiUtilsService.convertResponseData(jsonApiResult)[0],
        })),
        map(({ resourceItem, meta }) => {
          const entityResult = Object.entries(resourceItem).reduce(
            (acum, [key, val]) => {
              Object.defineProperties(acum, {
                [key]: {
                  value: val,
                  enumerable: true,
                },
              });
              return entity;
            },
            entity
          );
          if (returnMeta) {
            return { entity: entityResult, meta };
          }
          return entityResult;
        })
      );
  }

  public patchOne<Entity extends ObjectLiteral>(
    entity: Entity
  ): Observable<Entity>;
  public patchOne<Entity extends ObjectLiteral, MetaData extends Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: MetaData }>;
  public patchOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: any }>;
  public patchOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta?: boolean
  ): Observable<Entity | { entity: Entity; meta: Partial<Meta> }> {
    if (!entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const { attributes, relationships } =
      this.jsonApiUtilsService.generateBody(entity);
    const body = {
      data: {
        id: entity['id'].toString(),
        type: getTypeForReq(entity.constructor.name),
        attributes,
        relationships,
      },
    };
    const entityName = entity.constructor.name;
    return this.http
      .patch<ResourceObject<Entity>>(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
          entity['id']
        }`,
        body
      )
      .pipe(
        map((jsonApiResult) => ({
          meta: jsonApiResult.meta || {},
          resourceItem:
            this.jsonApiUtilsService.convertResponseData(jsonApiResult)[0],
        })),
        map(({ resourceItem, meta }) => {
          const entityResult = Object.entries(resourceItem).reduce(
            (acum, [key, val]) => {
              Object.defineProperties(acum, {
                [key]: {
                  value: val,
                  enumerable: true,
                },
              });
              return entity;
            },
            entity
          );
          if (returnMeta) {
            return { entity: entityResult, meta };
          }
          return entityResult;
        })
      );
  }

  public deleteOne<Entity extends ObjectLiteral>(
    entity: Entity
  ): Observable<void> {
    if (!entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const entityName = entity.constructor.name;
    return this.http.delete<void>(
      `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
        entity['id']
      }`
    );
  }

  public getRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<string[] | string> {
    if (!entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }
    const entityName = entity.constructor.name;
    return this.http
      .get<Relationship<Entity>>(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`
      )
      .pipe(
        map((result) => {
          const { data } = result;
          if (!data) {
            return [];
          }

          if (Array.isArray(data)) {
            return data.map((i) => i.id);
          } else {
            return data.id;
          }
        })
      );
  }

  public patchRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<string[] | string> {
    if (!entity['id']) {
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
          new Error(`${String(relationType)} should not be undefined in entity`)
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };
    const entityName = entity.constructor.name;
    return this.http
      .patch<Relationship<Entity>>(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map((result) => {
          const { data } = result;
          if (!data) {
            return [];
          }

          if (Array.isArray(data)) {
            return data.map((i) => i.id);
          } else {
            return data.id;
          }
        })
      );
  }

  public postRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<string[] | string> {
    if (!entity['id']) {
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
          new Error(`${String(relationType)} should not be undefined in entity`)
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };
    const entityName = entity.constructor.name;
    return this.http
      .post<Relationship<Entity>>(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map((result) => {
          const { data } = result;
          if (!data) {
            return [];
          }

          if (Array.isArray(data)) {
            return data.map((i) => i.id);
          } else {
            return data.id;
          }
        })
      );
  }

  deleteRelationships<Entity extends ObjectLiteral>(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<void> {
    if (!entity['id']) {
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
          new Error(`${String(relationType)} should not be undefined in entity`)
      );
    }

    const body = {
      data: this.jsonApiUtilsService.generateRelationshipsBody<
        Entity[EntityRelation<Entity>]
      >(entity[relationType]),
    };
    const entityName = entity.constructor.name;

    return this.http
      .delete(
        `${this.jsonApiUtilsService.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        { body }
      )
      .pipe(map(() => void 0));
  }
}
