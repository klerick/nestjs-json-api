import { Inject, Injectable, VersioningType } from '@nestjs/common';
import { ApplicationConfig } from '@nestjs/core';
import {
  Attributes,
  camelToKebab,
  Data,
  DataResult,
  EntityRelation,
  Include,
  MainData,
  ObjectTyped,
  Relationships,
  ResourceData,
  ResourceObject,
} from '../../../utils/nestjs-shared';

import { EntityClass, ObjectLiteral } from '../../../types';
import { ENTITY_MAP_PROPS, CURRENT_ENTITY } from '../../../constants';
import {
  EntityProps,
  RelationProperty,
  ZodEntityProps,
  ZodParams,
} from '../types';
import { Query, QueryOne } from '../zod';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';

Injectable();
export class JsonApiTransformerService<E extends ObjectLiteral> {
  @Inject(ApplicationConfig) private applicationConfig!: ApplicationConfig;
  @Inject(ENTITY_MAP_PROPS) private entityMapProps!: Map<
    EntityClass<E>,
    ZodEntityProps<E>
  >;
  @Inject(CURRENT_ENTITY) private currentEntity!: EntityClass<E>;

  private _urlPath!: string[];
  private _currentMapProps!: ZodEntityProps<E>;

  get currentMapProps(): ZodEntityProps<E> {
    if (!this._currentMapProps) {
      const result = this.entityMapProps.get(this.currentEntity);
      if (!result)
        throw new Error('Not found map for ' + this.currentEntity.name);

      this._currentMapProps = result;
    }

    return this._currentMapProps;
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
    query: QueryOne<E>
  ): Pick<ResourceObject<E>, 'data' | 'included'>;
  public transformData(
    data: E[],
    query: Query<E>
  ): Pick<ResourceObject<E, 'array'>, 'data' | 'included'>;
  public transformData(
    data: E | E[],
    query: Query<E>
  ):
    | Pick<ResourceObject<E>, 'data' | 'included'>
    | Pick<ResourceObject<E, 'array'>, 'data' | 'included'> {
    if (Array.isArray(data)) {
      const resultData: Pick<
        ResourceObject<E, 'array'>,
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

    const resultData: Pick<ResourceObject<E>, 'data' | 'included'> = {
      data: this.transformItem(data, this.currentMapProps, query),
    };

    if (query.include) {
      resultData.included = this.extractIncluded([data], query);
    }

    return resultData;
  }

  public transformItem<T extends ObjectLiteral = E>(
    item: T,
    mapProps: ZodEntityProps<T>,
    query: Query<T>
  ): ResourceData<T> {
    const { fields } = query;
    const target = Reflect.get(fields || {}, 'target');
    return {
      id: item[mapProps.primaryColumnName].toString(),
      type: mapProps.typeName,
      attributes: this.extractAttributes(
        item,
        mapProps.props.filter((i) => {
          if (i === mapProps.primaryColumnName) {
            return false;
          }
          if (!target) {
            return true;
          }

          return (target as string[]).includes(i);
        })
      ),
      links: {
        self: this.getLink(mapProps.typeName, item[mapProps.primaryColumnName]),
      },
      relationships: this.transformRelationships(item, mapProps, query),
    };
  }

  public transformRel<Rel extends EntityRelation<E>>(
    item: E,
    rel: Rel
  ): DataResult<E[Rel], Rel> {
    const relProps = Reflect.get(this.currentMapProps.relationProperty, rel);
    const relationMapPops = this.entityMapProps.get(relProps.entityClass);
    if (!relationMapPops)
      throw new Error('Not found props map for ' + relProps.entityClass);
    const props = item[rel];

    if (Array.isArray(props)) {
      return props.map((i: any) => ({
        type: relationMapPops.typeName,
        id: i[relationMapPops.primaryColumnName].toString(),
      }));
    } else {
      return props
        ? ({
            type: relationMapPops.typeName,
            id: props[relationMapPops.primaryColumnName].toString(),
          } as any)
        : null;
    }
  }

  public transformRelationships<T extends ObjectLiteral = E>(
    item: T,
    mapProps: ZodEntityProps<T>,
    query: Query<T>
  ): Relationships<T> {
    const { include } = query;

    const includeMap = new Map((include || []).map((i) => [i, true]));

    return mapProps.relations.reduce((acum, i: keyof RelationProperty<T>) => {
      acum[i as keyof Relationships<T>] = {
        links: {
          self: this.getLink(
            mapProps.typeName,
            item[mapProps.primaryColumnName],
            'relationships',
            i
          ),
        },
      };

      if (includeMap.has(i)) {
        const relationMapPops = this.entityMapProps.get(
          mapProps.relationProperty[i].entityClass
        );
        if (!relationMapPops)
          throw new Error(
            'Not found props map for ' +
              mapProps.relationProperty[i].entityClass.name
          );
        if (mapProps.relationProperty[i].isArray) {
          if (item[i] && Array.isArray(item[i]) && item[i].length > 0) {
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
          // @ts-expect-error incorrect parse
          acum[i as keyof Relationships<T>]['data'] = item[i]
            ? {
                id: item[i][relationMapPops.primaryColumnName].toString(),
                type: relationMapPops.typeName,
              }
            : null;
        }
      }

      return acum;
    }, {} as Relationships<T>);
  }

  public extractAttributes<T extends ObjectLiteral = E>(
    item: T,
    fields: (keyof T)[]
  ): Attributes<T> {
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
    }, {} as Attributes<T>);
  }

  public extractIncluded<T extends ObjectLiteral = E>(
    data: T[],
    query: Query<E>
  ): Include<T>[] {
    const includeArray: any[] = [];
    const { include } = query;
    if (!include) return [];
    for (const relationPropsFromInclude of include) {
      const relationProps =
        this.currentMapProps.relationProperty[relationPropsFromInclude];
      if (!relationProps) continue;
      const relationMapProp = this.entityMapProps.get(
        relationProps.entityClass
      );
      if (!relationMapProp)
        throw new Error(
          'Not found props for relation ' +
            relationPropsFromInclude +
            'in' +
            this.currentEntity.name
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
            selectFieldForInclude.length > 0
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
              this.transformItem<typeof i>(
                i,
                relationMapProp as unknown as ZodEntityProps<typeof i>,
                queryForInclude as Query<typeof i>
              )
            );
          }
        } else {
          includeArray.push(
            this.transformItem<typeof dataItem>(
              propRel,
              relationMapProp as unknown as ZodEntityProps<typeof dataItem>,
              queryForInclude as Query<typeof dataItem>
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
