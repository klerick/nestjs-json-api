import { Inject, Injectable, VersioningType } from '@nestjs/common';
import { ApplicationConfig } from '@nestjs/core';
import {
  Attributes,
  Include,
  ObjectTyped,
  PropertyKeys,
  Relationships,
  ResourceData,
  ResourceObject,
  BaseMainData,
  RelationKeys,
  EntityClass,
} from '@klerick/json-api-nestjs-shared';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';

import { EntityParam } from '../../../types';
import { Query, QueryOne } from '../zod';
import { EntityParamMapService } from './entity-param-map.service';

function assertColumnName<E extends object>(
  entity: E,
  columnName: string
): asserts columnName is keyof EntityClass<E> {
  const entityType = entity as EntityClass<E>;
  if (!(columnName in entityType)) {
    throw new Error(`${columnName} not exist in ${entityType.name}`);
  }
}

Injectable();
export class JsonApiTransformerService<
  E extends object,
  IdKey extends string = 'id'
> {
  @Inject(ApplicationConfig) private applicationConfig!: ApplicationConfig;

  @Inject(EntityParamMapService)
  private entityParamMapService!: EntityParamMapService<E, IdKey>;

  private _urlPath!: string[];

  get currentMapProps(): EntityParam<E, IdKey> {
    return this.entityParamMapService.entityParaMap;
  }

  get urlPath() {
    if (this._urlPath) return [...this._urlPath];
    this._urlPath = [''];
    const prefix = this.applicationConfig.getGlobalPrefix();
    const version = this.applicationConfig.getVersioning();

    const routePathFactory = new RoutePathFactory(this.applicationConfig);

    if (prefix) {
      this._urlPath.push(this.applicationConfig.getGlobalPrefix());
    }
    if (version && version.type === VersioningType.URI) {
      const firstVersion = Array.isArray(version.defaultVersion)
        ? version.defaultVersion[0]
        : version.defaultVersion;
      if (firstVersion) {
        this._urlPath.push(
          `${routePathFactory.getVersionPrefix(
            version
          )}${firstVersion.toString()}`
        );
      }
    }
    return [...this._urlPath];
  }

  public transformData(
    data: E,
    query: QueryOne<E, IdKey>
  ): Pick<ResourceObject<E, 'object', null, IdKey>, 'data' | 'included'>;
  public transformData(
    data: E[],
    query: Query<E, IdKey>
  ): Pick<ResourceObject<E, 'array', null, IdKey>, 'data' | 'included'>;
  public transformData(
    data: E | E[],
    query: Query<E, IdKey>
  ):
    | Pick<ResourceObject<E, 'object', null, IdKey>, 'data' | 'included'>
    | Pick<ResourceObject<E, 'array', null, IdKey>, 'data' | 'included'> {
    if (Array.isArray(data)) {
      const resultData: Pick<
        ResourceObject<E, 'array', null, IdKey>,
        'data' | 'included'
      > = {
        data: data.map((item) =>
          this.transformItem(item, this.currentMapProps, query)
        ),
      };

      if (query.include) {
        resultData.included = this.extractIncluded(data, query);
      }

      return resultData;
    }

    const resultData: Pick<
      ResourceObject<E, 'object', null, IdKey>,
      'data' | 'included'
    > = {
      data: this.transformItem(data, this.currentMapProps, query),
    };

    if (query.include) {
      resultData.included = this.extractIncluded([data], query);
    }

    return resultData;
  }

  public transformItem<T extends object = E, TIdKey extends string = IdKey>(
    item: T,
    mapProps: EntityParam<T, TIdKey>,
    query: Query<T, TIdKey>
  ): ResourceData<T, TIdKey> {
    const { fields } = query;
    const targetField = fields && 'target' in fields ? fields.target : null;
    assertColumnName(item, mapProps.primaryColumnName);
    const props = ObjectTyped.keys(mapProps.propsType).filter((i) => {
      if (i.toString() === mapProps.primaryColumnName.toString()) {
        return false;
      }
      if (!targetField) {
        return true;
      }

      return (targetField as any[]).includes(i);
    });

    return {
      id: `${item[mapProps.primaryColumnName]}`,
      type: mapProps.typeName,
      attributes: this.extractAttributes<T, TIdKey>(item, props),
      links: {
        self: this.getLink(mapProps.typeName, item[mapProps.primaryColumnName]),
      },
      relationships: this.transformRelationships<T, TIdKey>(
        item,
        mapProps,
        query
      ),
    };
  }

  public transformRel<Rel extends RelationKeys<E, IdKey>>(
    item: E,
    rel: Rel
  ): BaseMainData<E, IdKey, Rel>['data'] {
    const relProps = Reflect.get(this.currentMapProps.relationProperty, rel);
    const relationMapPops = this.entityParamMapService.getParamMap(
      relProps.entityClass as EntityClass<object>
    );
    if (!relationMapPops)
      throw new Error('Not found props map for ' + relProps.entityClass);
    const props = item[rel];

    if (Array.isArray(props)) {
      return props.map((i: any) => ({
        type: relationMapPops.typeName,
        id: i[relationMapPops.primaryColumnName].toString(),
      })) as BaseMainData<E, IdKey, Rel>['data'];
    } else {
      assertColumnName(item[rel] as any, relationMapPops.primaryColumnName);
      return props
        ? ({
            type: relationMapPops.typeName,
            id: (props[relationMapPops.primaryColumnName] as any).toString(),
          } as any)
        : null;
    }
  }

  public transformRelationships<
    T extends object = E,
    TIdKey extends string = IdKey
  >(
    item: T,
    mapProps: EntityParam<T, TIdKey>,
    query: Query<T, TIdKey>
  ): Relationships<T, TIdKey> {
    const { include } = query;
    const includeMap = new Map<Query<T, TIdKey>['include'], boolean>((include || [])
      .map((i) => [i, true]));
    const primaryColumnName = mapProps.primaryColumnName;
    assertColumnName<typeof item>(item, primaryColumnName);

    return ObjectTyped.keys(mapProps.relationProperty).reduce((acum, i) => {
      acum[i as keyof Relationships<T, TIdKey>] = {
        links: {
          self: this.getLink(
            mapProps.typeName,
            item[primaryColumnName],
            'relationships',
            i.toString()
          ),
        },
      };

      if (includeMap.has(i as any)) {
        const relationMapPops = this.entityParamMapService.getParamMap(
          mapProps.relationProperty[i].entityClass as EntityClass<object>
        );
        if (!relationMapPops)
          throw new Error(
            'Not found props map for ' +
              mapProps.relationProperty[i].entityClass.name
          );

        if (mapProps.relationProperty[i].isArray) {
          if (item[i] && Array.isArray(item[i]) && (item[i] as []).length > 0) {
            // @ts-expect-error incorrect parse
            acum[i as keyof Relationships<T>]['data'] = item[i].map(
              (rel: any) => ({
                id: rel[relationMapPops.primaryColumnName].toString(),
                type: relationMapPops.typeName,
              })
            );
          } else {
            // @ts-expect-error incorrect parse
            acum[i as keyof Relationships<T>]['data'] = [];
          }
        } else {
          const relPrimaryColumnName = relationMapPops.primaryColumnName;
          const relType = item[i] as object;
          if (item[i]) {
            assertColumnName<typeof relType>(relType, relPrimaryColumnName);
            // @ts-expect-error incorrect parse
            acum[i as keyof Relationships<T>]['data'] = {
              id: `${relType[relPrimaryColumnName]}`,
              type: relationMapPops.typeName,
            };
          } else {
            // @ts-expect-error incorrect parse
            acum[i as keyof Relationships<T>]['data'] = null;
          }
        }
      }

      return acum;
    }, {} as Relationships<T, TIdKey>);
  }

  public extractAttributes<T extends object = E, TIdKey extends string = IdKey>(
    item: T,
    fields: PropertyKeys<T, TIdKey>[]
  ): Attributes<T, TIdKey> {
    const mapFields = fields.reduce((acum, field) => {
      acum[field.toString()] = true;
      return acum;
    }, {} as Record<string, boolean>);
    return ObjectTyped.entries(item).reduce((acum, [name, value]) => {
      if (name in mapFields && mapFields[name.toString()]) {
        // @ts-expect-error assign key to object entity
        acum[name] = value;
      }
      return acum;
    }, {} as Attributes<T, TIdKey>);
  }

  public extractIncluded<T extends object = E, TIdKey extends string = IdKey>(
    data: T[],
    query: Query<E, IdKey>
  ): Include<T, TIdKey>[] {
    const includeArray: any[] = [];
    const { include } = query;
    if (!include) return [];
    for (const relationPropsFromInclude of include) {
      const relationProps =
        this.currentMapProps.relationProperty[relationPropsFromInclude];
      if (!relationProps) continue;
      const relationMapProp = this.entityParamMapService.getParamMap(
        relationProps.entityClass as EntityClass<object>
      );
      if (!relationMapProp)
        throw new Error(
          'Not found props for relation ' +
            relationPropsFromInclude +
            'in' +
            this.currentMapProps.className
        );
      const { fields } = query;

      const selectFieldForInclude = Reflect.get(
        fields || {},
        relationPropsFromInclude
      );

      const queryForInclude = {
        ...query,
        fields: {
          target:
            selectFieldForInclude &&
            Array.isArray(selectFieldForInclude) &&
            (selectFieldForInclude as []).length > 0
              ? selectFieldForInclude
              : null,
        },
        include: null,
      };

      for (const dataItem of data) {
        const propRel = dataItem[relationPropsFromInclude];
        if (!propRel) continue;
        if (Array.isArray(propRel)) {
          for (const i of propRel as any) {
            includeArray.push(
              this.transformItem<typeof i, 'id'>(
                i,
                relationMapProp as unknown as EntityParam<typeof i>,
                queryForInclude as unknown as Query<typeof i, 'id'>
              )
            );
          }
        } else {
          includeArray.push(
            this.transformItem<typeof dataItem, 'id'>(
              propRel,
              relationMapProp as unknown as EntityParam<typeof dataItem>,
              queryForInclude as Query<typeof dataItem, 'id'>
            )
          );
        }
      }
    }

    return includeArray;
  }

  private getLink(...partOfUrl: string[]) {
    const urlPath = this.urlPath;
    urlPath.push(...partOfUrl);
    return urlPath.join('/');
  }
}
