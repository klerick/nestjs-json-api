import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import {
  ALL_ENTITIES,
  JSON_API_SDK_CONFIG,
  JsonApiSdkConfig,
  ListEntities,
} from '../../token/json-api-sdk';

import {
  camelToKebab,
  capitalizeFirstChar,
  EmptyArrayRelation,
  getTypeForReq,
  isObject,
} from '../../utils';
import { QueryParams } from '../../types';

import { SortRules, ResourceObject, ResourceData } from 'json-api-nestjs';
import { ObjectLiteral } from 'typeorm';

@Injectable({
  providedIn: 'root',
})
export class JsonApiUtilsService {
  protected jsonApiSdkConfig = inject<JsonApiSdkConfig>(JSON_API_SDK_CONFIG);
  protected listEntities = inject<ListEntities>(ALL_ENTITIES);

  public getUrlForResource(resource: string): string {
    const url: string[] = [camelToKebab(resource).toLocaleLowerCase()];
    if (this.jsonApiSdkConfig.apiPrefix) {
      url.unshift(this.jsonApiSdkConfig.apiPrefix);
    }
    return new URL(url.join('/'), this.jsonApiSdkConfig.apiHost).toString();
  }

  public getQueryStringParams<Entity>(
    params: Partial<QueryParams<Entity>> = {}
  ): HttpParams {
    let httpParams = new HttpParams();
    const { include, fields, sort, page, filter } = params;
    if (include && Array.isArray(include) && include.length > 0) {
      httpParams = httpParams.set('include', include.join(','));
    }

    if (sort && isObject(sort)) {
      const {
        target: targetSort = {} as SortRules<Entity>['target'],
        ...relation
      } = sort;

      const resultSortQuery: string[] = [];

      for (const key in targetSort) {
        resultSortQuery.push(
          Reflect.get(targetSort, key) === 'ASC' ? key : `-${key}`
        );
      }
      for (const relKey in relation) {
        const relObject = Reflect.get(relation, relKey);
        for (const key in relObject) {
          resultSortQuery.push(
            Reflect.get(relObject, key) === 'ASC'
              ? `${relKey}.${key}`
              : `-${relKey}.${key}`
          );
        }
      }
      if (resultSortQuery.length > 0) {
        httpParams = httpParams.set('sort', resultSortQuery.join(','));
      }
    }

    if (page && isObject(page)) {
      const { number, size } = page;
      httpParams = httpParams.set(`page[number]`, `${number || 1}`);
      if (size) {
        httpParams = httpParams.set(`page[size]`, `${size}`);
      }
    }

    if (filter && isObject(filter)) {
      const { target: targetFilter = {}, relation } = filter;
      for (const key in targetFilter) {
        const filterItem = Reflect.get(targetFilter, key);
        for (const operand in filterItem) {
          httpParams = httpParams.set(
            `filter[${key}][${operand}]`,
            Array.isArray(filterItem[operand])
              ? filterItem[operand].join(',')
              : filterItem[operand]
          );
        }
      }
      for (const relKey in relation) {
        const relationProps = Reflect.get(relation, relKey);
        for (const key in relationProps) {
          const filterItem = relationProps[key];
          for (const operand in filterItem) {
            httpParams = httpParams.set(
              `filter[${relKey}.${key}][${operand}]`,
              Array.isArray(filterItem[operand])
                ? filterItem[operand].join(',')
                : filterItem[operand]
            );
          }
        }
      }
    }

    if (fields && isObject(fields)) {
      const { target: targetProps = [], ...relation } = fields;
      if (targetProps.length > 0) {
        httpParams = httpParams.set(
          'fields[target]',
          [...new Set(targetProps)].join(',')
        );
      }
      for (const key in relation) {
        const fields = Reflect.get(relation, key);
        if (fields.length > 0) {
          httpParams = httpParams.set(
            `fields[${key}]`,
            [...new Set(fields)].join(',')
          );
        }
      }
    }

    return httpParams;
  }

  public convertResponseData<Entity extends ObjectLiteral>(
    body: ResourceObject<Entity>,
    includeEntity: QueryParams<Entity>['include'] = []
  ): Entity[] {
    const { data, included = [] } = body;
    const arrayData = Array.isArray(data) ? data : [data];

    const result: Entity[] = [];

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

          if (Array.isArray(relationshipData)) {
            itemEntity[itemInclude] = relationshipData
              .map((item) => findIncludeEntity(item))
              .filter((i) => !!i);
          } else {
            itemEntity[itemInclude] = findIncludeEntity(relationshipData);
          }
        }
      }

      result.push(itemEntity);
    }
    return result;
  }

  public generateBody<Entity extends ObjectLiteral>(
    entity: Entity
  ): Pick<ResourceData<Entity>, 'relationships' | 'attributes'> {
    const attributes = Object.entries(entity)
      .filter(([key, val]) => {
        if (key === 'id' || val instanceof EmptyArrayRelation) {
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
        if (Array.isArray(val) && val.length === 0) {
          return true;
        }
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

  public createEntityInstance(name: string) {
    const entityName = capitalizeFirstChar(name);
    if (this.listEntities[capitalizeFirstChar(name)]) {
      return new this.listEntities[capitalizeFirstChar(name)]();
    }
    console.warn(`Do not find entity: "${entityName}". Will create in runtime`);
    return Function('return new class ' + entityName + '{}')();
  }

  public generateRelationshipsBody<RelationshipEntity extends ObjectLiteral>(
    relationshipEntity: RelationshipEntity | RelationshipEntity[]
  ) {
    const generateRelationObj = (relation: RelationshipEntity) => {
      return {
        id: String(relation['id']),
        type: getTypeForReq(relation.constructor.name),
      };
    };

    return Array.isArray(relationshipEntity)
      ? relationshipEntity.map((item) => generateRelationObj(item))
      : generateRelationObj(relationshipEntity);
  }
}
