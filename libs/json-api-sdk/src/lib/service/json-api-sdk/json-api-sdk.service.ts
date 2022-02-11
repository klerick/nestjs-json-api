import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { paramCase } from 'param-case';
import { ObjectLiteral, ObjectType } from 'typeorm/browser';
import { EMPTY, expand, map, Observable, reduce, throwError } from 'rxjs';

import { JSON_API_SDK_CONFIG, JsonApiSdkConfig, ListEntities, ALL_ENTITIES } from '../../token/json-api-sdk';
import {
  EntityArray,
  Operands,
  QueryParams,
  RelationshipData,
  ResourceData,
  ResourceObject
} from '../../types';

const capitalizeFirstChar = (str: string) =>
  str
    .split('-')
    .map((i) => i.charAt(0).toUpperCase() + i.substring(1))
    .join('');

const getTypeForReq = (str: string) => paramCase(str).toLocaleLowerCase();

@Injectable({
  providedIn: 'root'
})
export class JsonApiSdkService{
  public constructor(
    protected http: HttpClient,
    @Inject(JSON_API_SDK_CONFIG) protected jsonApiSdkConfig: JsonApiSdkConfig,
    @Inject(ALL_ENTITIES) protected listEntities: ListEntities,
  ) {
  }

  public getUrlForResource(resource: string): string{

    const url: string[] = [
      paramCase(resource).toLocaleLowerCase()
    ];
    if (this.jsonApiSdkConfig.apiPrefix) {
      url.unshift(this.jsonApiSdkConfig.apiPrefix)
    }
    return new URL(
      url.join('/'),
      this.jsonApiSdkConfig.apiHost
    ).toString();
  }

  public getOne<Entity extends ObjectLiteral>(
    entity: Entity,
    params?: Pick<QueryParams<Entity>, 'include' | 'field'>
  ): Observable<Entity>{
    if (!entity['id']) {
      return throwError(() =>
        new Error('Resource params should be instance of resource with id params')
      );
    }
    const entityName = entity.constructor.name;
    const query = this.getQueryString<Entity>(params, entityName);
    return this.http.get<ResourceObject<Entity>>(
      `${this.getUrlForResource(entityName)}/${entity['id']}`,
      { params: query }
    ).pipe(
      map<ResourceObject<Entity>, Entity>(
        (result) => this.convertResponseData<Entity>(result, params?.include)[0]
      )
    )
  }

  public getList<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params?: QueryParams<Entity>
  ): Observable<EntityArray<Entity>>{
    const query = this.getQueryString<Entity>(params, resource.name);
    return this.http.get<ResourceObject<Entity>>(
      this.getUrlForResource(resource.name),
      { params: query }
    ).pipe(
      map<ResourceObject<Entity>, EntityArray<Entity>>(result => {
        const resource = this.convertResponseData<Entity>(result, params?.include);
        const { totalItems, pageSize, pageNumber } = Object.assign(
          {
            totalItems: 0,
            pageNumber: 0,
            pageSize: 0,
          },
          result.meta
        )

        return new EntityArray<Entity>(resource, {
          totalItems,
          pageNumber,
          pageSize,
        })
      })
    )
  }

  public getAll<Entity extends ObjectLiteral>(
    resource: ObjectType<Entity>,
    params: QueryParams<Entity> = {}
  ): Observable<EntityArray<Entity>>{
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
            }
          }
        }
        return this.getList(resource, newParams)
      }),
      reduce<Entity[]>((acum, item) => {
        if (!acum && !Array.isArray(acum)) {
          acum = [];
        }
        acum.push(...item);
        return acum;
      }),
      map(r => new EntityArray<Entity>(r, {
        pageSize: r.length,
        pageNumber: 1,
        totalItems: r.length,
      }))
    )
  }

  public deleteOne<Entity extends ObjectLiteral>(entity: Entity): Observable<void> {
    if (!entity['id']) {
      return throwError(() =>
        new Error('Resource params should be instance of resource with id params')
      );
    }

    const entityName = entity.constructor.name;
    return this.http.delete<void>(
      `${this.getUrlForResource(entityName)}/${entity['id']}`
    );
  }

  public postOne<Entity extends ObjectLiteral>(entity: Entity): Observable<Entity> {
    const { attributes, relationships } = this.generateBody(entity);
    const body = {
      data: {
        type: getTypeForReq(entity.constructor.name),
        attributes,
        relationships,
      },
    };

    const entityName = entity.constructor.name;
    return this.http
      .post<ResourceObject<Entity>>(this.getUrlForResource(entityName), body)
      .pipe(
        map<ResourceObject<Entity>, Entity>((jsonApiResult) =>
          this.convertResponseData<Entity>(jsonApiResult)[0]
        ),
        map<Entity, Entity>((resourceItem) => {
          return Object.entries(resourceItem).reduce((acum, [key, val]) => {
            Object.defineProperties(acum, {
              [key]: {
                value: val
              },
            });
            return entity;
          }, entity);
        })
      );
  }

  public patchOne<Entity extends ObjectLiteral>(entity: Entity): Observable<Entity> {
    if (!entity['id']) {
      return throwError(() =>
        new Error('Resource params should be instance of resource with id params')
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
      .patch<ResourceObject<Entity>>(
        `${this.getUrlForResource(entityName)}/${entity['id']}`, body
      )
      .pipe(
        map<ResourceObject<Entity>, Entity>((jsonApiResult) => {
          return this.convertResponseData<Entity>(jsonApiResult)[0];
        }),
        map<Entity, Entity>((resourceItem) => {
          return Object.entries(resourceItem).reduce((acum, [key, val]) => {
            Object.defineProperties(acum, {
              [key]: {
                value: val
              },
            });
            return entity;
          }, entity);
        })
      );
  }

  protected convertResponseData<Entity extends ObjectLiteral>(
    body: ResourceObject<Entity>,
    includeEntity: QueryParams<Entity>['include'] = []
  ): Entity[] {
    const { data, included } = body;
    const arrayData = Array.isArray(data) ? data : [data];

    const result: Entity[] = []
    for(const dataItem of arrayData) {
      const itemEntity = this.createEntityInstance(dataItem.type);
      itemEntity['id'] = dataItem.id;
      Object.entries(dataItem.attributes || []).forEach(([key, val]) =>
        itemEntity[key] = val
      )

      if (includeEntity.length > 0) {
        for(const itemInclude of includeEntity) {
          if (!(dataItem.relationships && dataItem.relationships[itemInclude])) {
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
                includedItem.type === item.type &&
                includedItem.id === item.id
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

          if (Array.isArray(relationshipData)){
            itemEntity[itemInclude] = (relationshipData as RelationshipData<Entity>[])
              .map((item) => findIncludeEntity(item))
              .filter(i => !!i)
          } else {
            itemEntity[itemInclude] = findIncludeEntity((relationshipData as RelationshipData<Entity>))
          }
        }
      }

      result.push(itemEntity)
    }
    return result;
  }

  public getQueryString<Entity>(params: QueryParams<Entity> = {}, resource: string): HttpParams {
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

    if (pagination && !Array.isArray(pagination) && Object.keys(pagination).length > 0) {
      const { number, size } = pagination;
      httpParams = httpParams.set(`page[number]`, `${number || 1}`);
      httpParams = httpParams.set(`page[size]`, `${size}`);
    }

    return httpParams;
  }

  protected createEntityInstance(name: string){
    const entityName = capitalizeFirstChar(name)
    if (this.listEntities[capitalizeFirstChar(name)]) {
      return new this.listEntities[capitalizeFirstChar(name)]();
    }
    console.warn(`Do not find entity: "${entityName}". Will create in runtime`)
    return (Function('return new class ' + entityName + '{}'))()
  }

  protected generateBody<Entity extends ObjectLiteral>(
    entity: Entity
  ): Pick<ResourceData<Entity>, 'relationships' | 'attributes'>{

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
      .reduce<ResourceData<Entity>['attributes']>(
        (acum, [key, val]) => {
          Object.defineProperties(acum, {
            [key]: {
              value: val,
              configurable: true,
              enumerable: true,
              writable: true
            },
          })

          return acum;
        }, {} as ResourceData<Entity>['attributes']
      );

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
            value: {data},
            configurable: true,
            enumerable: true,
            writable: true
          },
        })
        return acum;
      }, {});

    return {attributes, relationships}
  }


}
