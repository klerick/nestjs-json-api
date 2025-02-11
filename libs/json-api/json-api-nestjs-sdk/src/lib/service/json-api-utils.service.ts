import { createEntityInstance } from '@klerick/json-api-nestjs-shared';

import {
  Attributes,
  Entity as EntityObject,
  Entity,
  EntityRelation,
  Include,
  JsonApiSdkConfig,
  MainData,
  QueryParams,
  RelationData,
  Relationships,
  ResourceObject,
  ResourceObjectRelationships,
  ReturnIfArray,
} from '../types';
import {
  camelToKebab,
  getTypeForReq,
  HttpParams,
  isObject,
  isRelation,
  ObjectTyped,
} from '../utils';
import { ID_KEY } from '../constants';

export class JsonApiUtilsService {
  constructor(private jsonApiSdkConfig: JsonApiSdkConfig) {}

  public getUrlForResource(resource: string): string {
    const url: string[] = [camelToKebab(resource).toLocaleLowerCase()];
    if (this.jsonApiSdkConfig.apiPrefix) {
      url.unshift(this.jsonApiSdkConfig.apiPrefix);
    }
    return new URL(url.join('/'), this.jsonApiSdkConfig.apiHost).toString();
  }

  public getQueryStringParams<Entity>(
    params: QueryParams<Entity> = {}
  ): HttpParams {
    let httpParams = this.getIncludeParam(params.include, new HttpParams());
    httpParams = this.getSortParam(params.sort, httpParams);
    httpParams = this.getPageParam(params.page, httpParams);
    httpParams = this.getFieldParam(params.fields, httpParams);
    httpParams = this.getFilterParam(params.filter, httpParams);

    return httpParams;
  }

  private getIncludeParam<E>(
    include: QueryParams<E>['include'],
    httpParams: HttpParams
  ): HttpParams {
    if (include && Array.isArray(include) && include.length > 0) {
      return httpParams.set('include', include.join(','));
    }

    return httpParams;
  }

  private getSortParam<E>(
    sort: QueryParams<E>['sort'],
    httpParams: HttpParams
  ): HttpParams {
    if (!sort || !isObject(sort) || Object.keys(sort).length === 0)
      return httpParams;
    const resultSortQuery: string[] = [];
    const { target, ...relation } = sort;
    if (target) {
      for (const [key, val] of Object.entries(target)) {
        resultSortQuery.push(val === 'ASC' ? key : `-${key}`);
      }
    }

    for (const [relName, relProps] of Object.entries(relation)) {
      if (!isObject(relProps)) continue;
      for (const [key, val] of Object.entries(relProps)) {
        resultSortQuery.push(
          val === 'ASC' ? `${relName}.${key}` : `-${relName}.${key}`
        );
      }
    }

    if (resultSortQuery.length > 0) {
      return httpParams.set('sort', resultSortQuery.join(','));
    }
    return httpParams;
  }

  private getPageParam<E>(
    page: QueryParams<E>['page'],
    httpParams: HttpParams
  ): HttpParams {
    if (!page || !isObject(page) || Object.keys(page).length === 0)
      return httpParams;

    const { number, size } = page;
    httpParams = httpParams.set(`page[number]`, `${number || 1}`);
    if (size) {
      return httpParams.set(`page[size]`, `${size}`);
    }
    return httpParams;
  }

  private getFieldParam<E>(
    field: QueryParams<E>['fields'],
    httpParams: HttpParams
  ): HttpParams {
    if (!field || !isObject(field) || Object.keys(field).length === 0)
      return httpParams;
    const { target: targetProps = [], ...relation } = field;
    if (targetProps.length > 0) {
      httpParams = httpParams.set(
        'fields[target]',
        [...new Set(targetProps)].join(',')
      );
    }

    for (const key in relation) {
      const fields = Reflect.get(relation, key);
      if (fields && fields.length > 0) {
        httpParams = httpParams.set(
          `fields[${key}]`,
          [...new Set(fields)].join(',')
        );
      }
    }

    return httpParams;
  }

  private getFilterParam<E>(
    filter: QueryParams<E>['filter'],
    httpParams: HttpParams
  ): HttpParams {
    if (!filter || !isObject(filter) || Object.keys(filter).length === 0)
      return httpParams;

    const { target, ...relation } = filter;
    if (target) {
      for (const [key, val] of Object.entries(target)) {
        if (!isObject(val)) continue;
        for (const [operand, filter] of Object.entries(val)) {
          httpParams = httpParams.set(
            `filter[${key}][${operand}]`,
            Array.isArray(filter)
              ? filter
                  .map((f) =>
                    this.jsonApiSdkConfig.dateFields.includes(key) &&
                    f instanceof Date
                      ? f.toJSON()
                      : f.toString()
                  )
                  .join(',')
              : filter === null
              ? 'null'
              : this.jsonApiSdkConfig.dateFields.includes(key) &&
                filter instanceof Date
              ? filter.toJSON()
              : filter.toString()
          );
        }
      }
    }

    for (const [relName, relProps] of Object.entries(relation)) {
      if (!isObject(relProps)) continue;
      for (const [key, val] of Object.entries(relProps)) {
        if (!isObject(val)) continue;
        for (const [operand, filter] of Object.entries(val)) {
          httpParams = httpParams.set(
            `filter[${relName}.${key}][${operand}]`,
            Array.isArray(filter) ? filter.join(',') : filter.toString()
          );
        }
      }
    }

    return httpParams;
  }

  convertResponseData<E>(
    body: ResourceObject<E>,
    includeEntity?: QueryParams<E>['include']
  ): E;
  convertResponseData<E>(
    body: ResourceObject<E, 'array'>,
    includeEntity?: QueryParams<E>['include']
  ): E[];
  convertResponseData<E, M>(
    body: ResourceObject<E, 'object', M>,
    includeEntity?: QueryParams<E>['include']
  ): E;
  convertResponseData<E, M>(
    body: ResourceObject<E, 'array', M>,
    includeEntity?: QueryParams<E>['include']
  ): E[];
  convertResponseData<E>(
    body: ResourceObject<E, 'array'> | ResourceObject<E>,
    includeEntity?: QueryParams<E>['include']
  ): E[] | E {
    const { data, included = [] } = body;

    const isArray = Array.isArray(data);
    const arrayData = isArray ? data : [data];
    const result: E[] = [];
    for (const dataItem of arrayData) {
      const entityObject = {
        [this.jsonApiSdkConfig.idKey]: this.jsonApiSdkConfig.idIsNumber
          ? parseInt((dataItem as any)[this.jsonApiSdkConfig.idKey], 10)
          : (dataItem as any)[this.jsonApiSdkConfig.idKey],
        ...Object.entries(dataItem.attributes || []).reduce(
          (acum, [key, val]) => {
            acum[key] = this.jsonApiSdkConfig.dateFields.includes(key)
              ? new Date(val)
              : val;

            return acum;
          },
          {} as Record<string, unknown>
        ),
      };
      const itemEntity = Object.assign(
        this.createEntityInstance<E>(dataItem.type) as object,
        entityObject
      ) as E;

      if (!includeEntity || includeEntity.length === 0) {
        result.push(itemEntity);
        continue;
      }
      for (const itemInclude of includeEntity) {
        if (!(dataItem.relationships && dataItem.relationships[itemInclude])) {
          continue;
        }
        const relationship = dataItem.relationships[itemInclude];
        if (!(relationship && relationship.data)) {
          continue;
        }
        const relationshipData = relationship.data;

        if (Array.isArray(relationshipData)) {
          itemEntity[itemInclude] = relationshipData.reduce((acum, item) => {
            const result = this.findIncludeEntity(item, included);
            if (result) acum.push(result);
            return acum;
          }, [] as E[EntityRelation<E>][]) as E[EntityRelation<E>];
        } else {
          const relation = this.findIncludeEntity(relationshipData, included);
          if (relation) itemEntity[itemInclude] = relation;
        }
      }
      result.push(itemEntity);
    }
    if (!isArray) {
      const firstItem = result[0];
      if (firstItem) return firstItem;
    }
    return result;
  }

  createEntityInstance<E>(name: string): E {
    return createEntityInstance<E>(name);
  }

  private findIncludeEntity<E, R extends MainData<EntityRelation<E>>>(
    item: R,
    included: Include<E>[]
  ): E[EntityRelation<E>] | undefined {
    const relatedIncluded = included.find(
      (includedItem) =>
        includedItem.type === item.type && includedItem.id === item.id
    );

    if (!relatedIncluded) return;

    const entityObject = {
      [this.jsonApiSdkConfig.idKey]: this.jsonApiSdkConfig.idIsNumber
        ? parseInt((relatedIncluded as any)[this.jsonApiSdkConfig.idKey], 10)
        : (relatedIncluded as any)[this.jsonApiSdkConfig.idKey],
      ...Object.entries(relatedIncluded.attributes || []).reduce(
        (acum, [key, val]) => {
          acum[key] = this.jsonApiSdkConfig.dateFields.includes(key)
            ? new Date(val)
            : val;

          return acum;
        },
        {} as Record<string, unknown>
      ),
    };
    return Object.assign(
      this.createEntityInstance<E[typeof item.type]>(
        item.type.toString()
      ) as object,
      entityObject
    ) as E[typeof item.type];
  }

  generateBody<E extends Entity>(entity: E) {
    const attributes = Object.entries(entity)
      .filter(([key, val]) => {
        if (key === ID_KEY) return false;
        const item = Array.isArray(val) ? val[0] : val;

        return !isRelation(item);
      })
      .reduce(
        (acum, [key, val]) => ({
          ...acum,
          [key]: val,
        }),
        {} as Attributes<E>
      );

    const relationships = ObjectTyped.entries(entity)
      .filter(([key, val]) => {
        if (key === ID_KEY) return false;
        const item = Array.isArray(val) ? val[0] : val;
        return isRelation(item);
      })
      .reduce((acum, [key, val]) => {
        let data;
        if (Array.isArray(val)) {
          data = val.map((i: any) => ({
            type: getTypeForReq(i.constructor.name),
            id: i[ID_KEY].toString(),
          }));
        } else {
          if ((val as any)[ID_KEY] !== null) {
            data = {
              type: getTypeForReq((val as any).constructor.name),
              id: (val as any)[ID_KEY].toString(),
            };
          } else {
            data = null;
          }
        }
        return {
          ...acum,
          [key]: { data },
        };
      }, {} as Relationships<E>);

    return { attributes, relationships };
  }

  getResultForRelation<
    Entity extends EntityObject,
    Rel extends EntityRelation<Entity>
  >(
    body: ResourceObjectRelationships<Entity, Rel>
  ): ReturnIfArray<Entity[Rel], string> {
    if (Array.isArray(body.data)) {
      return body.data.map(
        (i: any) => i[this.jsonApiSdkConfig.idKey]
      ) as ReturnIfArray<Entity[Rel], string>;
    } else {
      return (body.data as any)[this.jsonApiSdkConfig.idKey];
    }
  }

  public generateRelationshipsBody<RelationshipEntity extends EntityObject>(
    relationshipEntity: RelationshipEntity | RelationshipEntity[]
  ): RelationData | RelationData[] {
    const generateRelationObj = (
      relation: RelationshipEntity
    ): RelationData => ({
      id: String(relation[this.jsonApiSdkConfig.idKey]),
      type: getTypeForReq(relation.constructor.name),
    });

    return Array.isArray(relationshipEntity)
      ? relationshipEntity.map((item) => generateRelationObj(item))
      : generateRelationObj(relationshipEntity);
  }
}
