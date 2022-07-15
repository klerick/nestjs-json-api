import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { paramCase } from 'param-case';
import { ObjectLiteral, ObjectType } from 'typeorm/browser';
import { EMPTY, expand, map, Observable, reduce, throwError } from 'rxjs';

import {
  JSON_API_SDK_CONFIG,
  JsonApiSdkConfig,
  ListEntities,
  ALL_ENTITIES,
} from '../../token/json-api-sdk';
import {
  EntityArray,
  Operands,
  QueryParams,
  RelationshipData,
  ResourceData,
  ResourceObject,
  EntityRelation,
} from '../../types';

const capitalizeFirstChar = (str: string) =>
  str
    .split('-')
    .map((i) => i.charAt(0).toUpperCase() + i.substring(1))
    .join('');

const getTypeForReq = (str: string) => paramCase(str).toLocaleLowerCase();

@Injectable({
  providedIn: 'root',
})
export class JsonApiSdkService {
  public constructor(
    protected http: HttpClient,
    @Inject(JSON_API_SDK_CONFIG) protected jsonApiSdkConfig: JsonApiSdkConfig,
    @Inject(ALL_ENTITIES) protected listEntities: ListEntities
  ) {}

  public getUrlForResource(resource: string): string {
    const url: string[] = [paramCase(resource).toLocaleLowerCase()];
    if (this.jsonApiSdkConfig.apiPrefix) {
      url.unshift(this.jsonApiSdkConfig.apiPrefix);
    }
    return new URL(url.join('/'), this.jsonApiSdkConfig.apiHost).toString();
  }

  public getOne<Entity extends ObjectLiteral>(
    entity: Entity
  ): Observable<Entity>;
  public getOne<Entity extends ObjectLiteral, Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public getOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: any }>;
  public getOne<Entity extends ObjectLiteral>(
    entity: Entity,
    params: Pick<QueryParams<Entity>, 'include' | 'field'>
  ): Observable<Entity>;
  public getOne<Entity extends ObjectLiteral, Meta>(
    entity: Entity,
    params: Pick<QueryParams<Entity>, 'include' | 'field'>,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public getOne<Entity extends ObjectLiteral>(
    entity: Entity,
    params: Pick<QueryParams<Entity>, 'include' | 'field'>,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: any }>;
  public getOne(
    entity?: any,
    params?: any,
    returnMeta?: boolean
  ): Observable<any> {
    if (!entity || !entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }
    const entityName = entity.constructor.name;
    const query = this.getQueryString(params, entityName);
    return this.http
      .get<any>(`${this.getUrlForResource(entityName)}/${entity['id']}`, {
        params: query,
      })
      .pipe(
        map((result) => {
          const entity = this.convertResponseData(result, params?.include)[0];
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

  public getList<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>> {
    const query = this.getQueryString<Entity>(params, resource.name);
    return this.http
      .get<ResourceObject<Entity>>(this.getUrlForResource(resource.name), {
        params: query,
      })
      .pipe(
        map<ResourceObject<Entity>, EntityArray<Entity>>((result) => {
          const resource = this.convertResponseData<Entity>(
            result,
            params?.include
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

  public getAll<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params: QueryParams<Entity> = {}
  ): Observable<EntityArray<Entity>> {
    return this.getList(resource, params).pipe(
      expand((r) => {
        if (r.pageNumber * r.pageSize >= r.totalItems) {
          return EMPTY;
        }
        const newParams = {
          ...params,
          ...{
            pagination: {
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
      `${this.getUrlForResource(entityName)}/${entity['id']}`
    );
  }

  public postOne<Entity extends ObjectLiteral>(
    entity: Entity
  ): Observable<Entity>;
  public postOne<Entity extends ObjectLiteral, Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public postOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: any }>;
  public postOne(entity: any, returnMeta?: boolean): Observable<any> {
    const { attributes, relationships } = this.generateBody(entity);
    const body = {
      data: {
        type: getTypeForReq(entity.constructor.name),
        attributes,
        relationships,
      },
    };

    const entityName = entity.constructor.name;
    return this.http.post<any>(this.getUrlForResource(entityName), body).pipe(
      map((jsonApiResult) => ({
        meta: jsonApiResult.meta || {},
        resourceItem: this.convertResponseData(jsonApiResult)[0],
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
  public patchOne<Entity extends ObjectLiteral, Meta>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: Meta }>;
  public patchOne<Entity extends ObjectLiteral>(
    entity: Entity,
    returnMeta: boolean
  ): Observable<{ entity: Entity; meta: any }>;
  public patchOne(entity: any, returnMeta?: boolean): Observable<any> {
    if (!entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const { attributes, relationships } = this.generateBody(entity);

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
      .patch<any>(`${this.getUrlForResource(entityName)}/${entity['id']}`, body)
      .pipe(
        map((jsonApiResult) => ({
          meta: jsonApiResult.meta || {},
          resourceItem: this.convertResponseData(jsonApiResult)[0],
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

  protected convertResponseData<Entity extends ObjectLiteral>(
    body: ResourceObject<Entity>,
    includeEntity: QueryParams<Entity>['include'] = []
  ): Entity[] {
    const { data, included } = body;
    const arrayData = Array.isArray(data) ? data : [data];

    const result: Entity[] = [];
    for (const dataItem of arrayData) {
      const itemEntity = this.createEntityInstance(dataItem.type);
      itemEntity['id'] = dataItem.id;
      Object.entries(dataItem.attributes || []).forEach(
        ([key, val]) => (itemEntity[key] = val)
      );

      if (includeEntity.length > 0) {
        for (const itemInclude of includeEntity) {
          if (
            !(dataItem.relationships && dataItem.relationships[itemInclude])
          ) {
            continue;
          }
          const relationship = dataItem.relationships[itemInclude];
          if (!(relationship && relationship.data)) {
            continue;
          }
          const relationshipData = relationship.data;

          const findIncludeEntity = (item: ResourceData<Entity>) => {
            const relatedResource = this.createEntityInstance(item.type);
            const relatedIncluded = included.find(
              (includedItem) =>
                includedItem.type === item.type && includedItem.id === item.id
            );
            if (!relatedIncluded) {
              return;
            }
            relatedResource['id'] = relatedIncluded.id;
            Object.entries(relatedIncluded.attributes || {}).forEach(
              ([key, val]) => (relatedResource[key] = val)
            );
            return relatedResource;
          };

          if (Array.isArray(relationshipData)) {
            itemEntity[itemInclude] = (
              relationshipData as RelationshipData<Entity>[]
            )
              .map((item) => findIncludeEntity(item))
              .filter((i) => !!i);
          } else {
            itemEntity[itemInclude] = findIncludeEntity(
              relationshipData as RelationshipData<Entity>
            );
          }
        }
      }

      result.push(itemEntity);
    }
    return result;
  }

  public getQueryString<Entity>(
    params: QueryParams<Entity> = {},
    resource: string
  ): HttpParams {
    let httpParams = new HttpParams();
    const { include, sort, field, pagination, filter } = params;
    if (include && Array.isArray(include)) {
      httpParams = httpParams.set('include', include.join(','));
    }

    if (filter && !Array.isArray(filter) && Object.keys(filter).length > 0) {
      const { relation, target } = filter;
      Object.entries(target).forEach(([key, value]) => {
        Object.entries(value as Operands).forEach(([k, v]) => {
          httpParams = httpParams.set(
            `filter[${key}][${k}]`,
            Array.isArray(v) ? v.join(',') : v
          );
        });
      });

      Object.entries<any>(relation || {}).forEach(([keyT, table]) => {
        Object.entries(table).forEach(([keyF, field]) => {
          Object.entries(field as Operands).forEach(([k, v]) => {
            httpParams = httpParams.set(
              `filter[${keyT}.${keyF}][${k}]`,
              Array.isArray(v) ? v.join(',') : v
            );
          });
        });
      });
    }

    if (sort && !Array.isArray(sort) && Object.keys(sort).length > 0) {
      httpParams = httpParams.set(
        'sort',
        Object.entries(sort)
          .map(([field, type]) => (type === 'ASC' ? field : `-${field}`))
          .join(',')
      );
    }

    if (
      pagination &&
      !Array.isArray(pagination) &&
      Object.keys(pagination).length > 0
    ) {
      const { number, size } = pagination;
      httpParams = httpParams.set(`page[number]`, `${number || 1}`);
      httpParams = httpParams.set(`page[size]`, `${size}`);
    }

    return httpParams;
  }

  protected createEntityInstance(name: string) {
    const entityName = capitalizeFirstChar(name);
    if (this.listEntities[capitalizeFirstChar(name)]) {
      return new this.listEntities[capitalizeFirstChar(name)]();
    }
    console.warn(`Do not find entity: "${entityName}". Will create in runtime`);
    return Function('return new class ' + entityName + '{}')();
  }

  protected generateBody<Entity extends ObjectLiteral>(
    entity: Entity
  ): Pick<ResourceData<Entity>, 'relationships' | 'attributes'> {
    const attributes = Object.entries(entity)
      .filter(([key, val]) => {
        if (key === 'id') {
          return false;
        }
        const item = Array.isArray(val) ? val[0] : val;
        if (!item?.constructor) {
          return true;
        }

        return !this.listEntities[item.constructor.name];
      })
      .reduce<ResourceData<Entity>['attributes']>((acum, [key, val]) => {
        Object.defineProperties(acum, {
          [key]: {
            value: val,
            configurable: true,
            enumerable: true,
            writable: true,
          },
        });

        return acum;
      }, {} as ResourceData<Entity>['attributes']);

    const relationships = Object.entries(entity)
      .filter(([key, val]) => {
        const item = Array.isArray(val) ? val[0] : val;
        if (!item?.constructor || key === 'id') {
          return false;
        }

        return this.listEntities[item.constructor.name];
      })
      .reduce<ResourceData<Entity>['relationships']>((acum, [key, val]) => {
        let data;
        if (Array.isArray(val)) {
          data = val.map((i) => ({
            type: getTypeForReq(i.constructor.name),
            id: i.id,
          }));
        } else {
          if (val.id !== null) {
            data = {
              type: getTypeForReq(val.constructor.name),
              id: val.id,
            };
          } else {
            data = null;
          }
        }
        Object.defineProperties(acum, {
          [key]: {
            value: { data },
            configurable: true,
            enumerable: true,
            writable: true,
          },
        });
        return acum;
      }, {});

    return { attributes, relationships };
  }

  public getRelationships<
    Entity extends ObjectLiteral,
    RelationEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<Partial<RelationEntity> | Partial<RelationEntity>[]>;
  public getRelationships<
    Entity extends ObjectLiteral,
    RelationEntity extends ObjectLiteral,
    AttributeEntity
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>,
    needAttribute: new () => AttributeEntity
  ): Observable<{
    relation: Partial<RelationEntity>[];
    attribute: { [key: string]: AttributeEntity };
  }>;
  public getRelationships(
    entity: any,
    relationType: any,
    needAttribute?: any
  ): Observable<any> {
    if (!entity['id']) {
      return throwError(
        () =>
          new Error(
            'Resource params should be instance of resource with id params'
          )
      );
    }

    const entityName = entity.constructor.name;
    const options: { params?: HttpParams } = {};
    if (needAttribute) {
      options['params'] = new HttpParams({
        fromObject: {
          'need-attribute': true,
        },
      });
    }
    return this.http
      .get<any>(
        `${this.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        options
      )
      .pipe(
        map((body) => {
          const { data } = body;
          if (Array.isArray(data)) {
            const relation = data.map((item) => {
              const instance = this.createEntityInstance(item.type);
              instance.id = item.id;
              return instance;
            });

            if (needAttribute) {
              const attribute = data.reduce((acum, item) => {
                acum[item.id] = Object.assign(
                  new needAttribute(),
                  item.attributes
                );
                return acum;
              }, {});
              return { relation, attribute };
            } else {
              return relation;
            }
          } else {
            const instance = this.createEntityInstance(data.type);
            instance.id = data.id;
            return instance;
          }
        })
      );
  }

  public patchRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<Partial<RelationshipEntity> | Partial<RelationshipEntity>[]>;
  public patchRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral,
    AttributeEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>,
    attribute: { [key: string]: AttributeEntity }
  ): Observable<{
    relation: Partial<RelationshipEntity> | Partial<RelationshipEntity>[];
    attribute: { [key: string]: AttributeEntity };
  }>;
  public patchRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral,
    AttributeEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>,
    attribute?: any
  ): Observable<any> {
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

    const relationshipEntity = entity[relationType];

    const body = {
      data: this.generateRelationshipsBody<RelationshipEntity, AttributeEntity>(
        relationshipEntity,
        attribute
      ),
    };
    const entityName = entity.constructor.name;
    return this.http
      .patch<any>(
        `${this.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map(() => {
          if (attribute) {
            return { relation: relationshipEntity, attribute };
          } else return relationshipEntity;
        })
      );
  }

  public postRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>
  ): Observable<Partial<RelationshipEntity> | Partial<RelationshipEntity>[]>;
  public postRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral,
    AttributeEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>,
    attribute: { [key: string]: AttributeEntity }
  ): Observable<{
    relation: Partial<RelationshipEntity> | Partial<RelationshipEntity>[];
    attribute: { [key: string]: AttributeEntity };
  }>;
  public postRelationships<
    Entity extends ObjectLiteral,
    RelationshipEntity extends ObjectLiteral,
    AttributeEntity extends ObjectLiteral
  >(
    entity: Entity,
    relationType: EntityRelation<Entity>,
    attribute?: any
  ): Observable<any> {
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

    const relationshipEntity = entity[relationType];

    const body = {
      data: this.generateRelationshipsBody<RelationshipEntity, AttributeEntity>(
        relationshipEntity,
        attribute
      ),
    };
    const entityName = entity.constructor.name;
    return this.http
      .post<any>(
        `${this.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        body
      )
      .pipe(
        map(() => {
          if (attribute) {
            return { relation: relationshipEntity, attribute };
          } else return relationshipEntity;
        })
      );
  }

  public deleteRelationships<Entity extends ObjectLiteral>(
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

    const relationshipEntity = entity[relationType];

    const body = {
      data: this.generateRelationshipsBody(relationshipEntity),
    };
    const entityName = entity.constructor.name;
    return this.http
      .request(
        'delete',
        `${this.getUrlForResource(entityName)}/${
          entity['id']
        }/relationships/${String(relationType)}`,
        { body }
      )
      .pipe(map(() => void 0));
  }

  generateRelationshipsBody<
    RelationshipEntity extends ObjectLiteral,
    AttributeEntity extends ObjectLiteral = {}
  >(
    relationshipEntity: RelationshipEntity | RelationshipEntity[],
    attributes?: { [key: string]: AttributeEntity }
  ) {
    const generateRelationObj = (relation: RelationshipEntity) => {
      const dataObj = {
        id: String(relation['id']),
        type: getTypeForReq(relation.constructor.name),
      };
      if (attributes?.[relation['id']]) {
        Object.assign(dataObj, { attributes: attributes?.[relation['id']] });
      }
      return dataObj;
    };

    const data = Array.isArray(relationshipEntity)
      ? relationshipEntity.map((item) => generateRelationObj(item))
      : generateRelationObj(relationshipEntity);
    return data;
  }
}
