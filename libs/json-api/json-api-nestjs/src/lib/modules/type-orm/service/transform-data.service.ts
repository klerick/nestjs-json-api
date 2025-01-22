import { Inject, Injectable, VersioningType } from '@nestjs/common';
import { ApplicationConfig } from '@nestjs/core';
import {
  Attributes,
  Data,
  MainData,
  Relationships,
  ResourceData,
  ResourceObject,
  camelToKebab,
  ObjectTyped,
  EntityRelation,
} from '@klerick/json-api-nestjs-shared';

import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import { EntityPropsMapService } from './entity-props-map.service';
import { ObjectLiteral } from '../../../types';

Injectable();
export class TransformDataService<E extends ObjectLiteral> {
  @Inject(ApplicationConfig) private applicationConfig!: ApplicationConfig;
  @Inject(EntityPropsMapService)
  private entityPropsMapService!: EntityPropsMapService;

  private _urlPath!: string[];

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
  private getLink(...partOfUrl: string[]) {
    const urlPath = this.urlPath;
    urlPath.push(...partOfUrl);
    return urlPath.join('/');
  }

  public transformData(data: E): Pick<ResourceObject<E>, 'data' | 'included'>;
  public transformData(
    data: E[]
  ): Pick<ResourceObject<E, 'array'>, 'data' | 'included'>;
  public transformData(
    data: E | E[]
  ):
    | Pick<ResourceObject<E>, 'data' | 'included'>
    | Pick<ResourceObject<E, 'array'>, 'data' | 'included'> {
    const dataResponse = Array.isArray(data)
      ? data
          .map((i) => this.getMainData(i))
          .filter((i: ResourceData<E> | null): i is ResourceData<E> => !!i)
      : this.getMainData(data);

    let relationships: Relationships<E> | undefined = undefined;
    if (Array.isArray(dataResponse) && dataResponse.length > 0) {
      relationships = dataResponse.reduce(
        (acum, item) => ({
          ...acum,
          ...item.relationships,
        }),
        {} as Relationships<E>
      );
    }

    if (!Array.isArray(dataResponse) && dataResponse !== null) {
      relationships = dataResponse.relationships;
    }

    if (relationships === undefined) {
      return { data: dataResponse } as Pick<
        ResourceObject<E>,
        'data' | 'included'
      >;
    }

    const propsNeedForInclude = ObjectTyped.entries(relationships).reduce(
      (acum, [key, val]) => {
        if (!val || !('data' in val)) {
          return acum;
        }
        if (Array.isArray(val.data)) {
          acum.push(key);
          return acum;
        }
        if (!Array.isArray(val.data)) {
          acum.push(key);
        }
        return acum;
      },
      [] as EntityRelation<E>[]
    );

    const included = (Array.isArray(data) ? data : [data])
      .reduce((acum, item) => {
        const tmp = propsNeedForInclude.reduce((a, props) => {
          const currentItem = item[props];
          type CurrentItem = typeof currentItem;
          const r = (
            Array.isArray(currentItem) ? currentItem : [currentItem]
          ) as CurrentItem[];

          a.push(...r);
          return a;
        }, [] as E[EntityRelation<E>][]);
        acum.push(...tmp);
        return acum;
      }, [] as E[EntityRelation<E>][])
      .map((i) => {
        return this.getMainData(i as E);
      })
      .filter((i) => !!i);

    if (included.length > 0) {
      return { data: dataResponse, included } as unknown as Pick<
        ResourceObject<E>,
        'data' | 'included'
      >;
    }
    return { data: dataResponse } as unknown as Pick<
      ResourceObject<E>,
      'data' | 'included'
    >;
  }

  getMainData(data: E): ResourceData<E> | null {
    if (!data) return null;
    const entity = data.constructor as unknown as E;
    return {
      ...this.getData(
        camelToKebab(this.entityPropsMapService.getNameForEntity(entity)),
        data[this.entityPropsMapService.getPrimaryColumnsForEntity(entity)] as
          | string
          | number
      ),
      attributes: ObjectTyped.entries(data).reduce((acum, [key, val]) => {
        if (
          this.entityPropsMapService
            .getRelPropsForEntity(entity)
            .includes(key.toString()) ||
          key.toString() ===
            this.entityPropsMapService.getPrimaryColumnsForEntity(entity)
        ) {
          return acum;
        }
        acum[key] = val;
        return acum;
      }, {} as Record<keyof E, E[keyof E]>) as Attributes<E>,
      relationships: this.transformRelationshipsData(data),
      links: {
        self: this.getLink(
          camelToKebab(this.entityPropsMapService.getNameForEntity(entity)),
          data[
            this.entityPropsMapService.getPrimaryColumnsForEntity(entity)
          ] as string
        ),
      },
    };
  }

  getRelationships<Rel extends EntityRelation<E>>(
    data: E,
    rel: Rel
  ): Data<E[Rel], Rel> {
    const entity = data.constructor as unknown as E;
    const relation = data[rel];
    const target = this.entityPropsMapService.getRelationPropsType(entity, rel);
    const typeName = camelToKebab(
      this.entityPropsMapService.getNameForEntity(target)
    ) as Rel;

    const primaryColumn =
      this.entityPropsMapService.getPrimaryColumnsForEntity(target);

    const resultData = Array.isArray(relation)
      ? (relation as E[Rel][]).map((i: E[Rel]) =>
          this.getData<Rel>(
            typeName,
            i[primaryColumn as keyof E[Rel]] as string
          )
        )
      : relation === null || !relation
      ? null
      : this.getData(
          typeName,
          relation[primaryColumn as keyof E[Rel]] as string
        );

    return {
      data: resultData,
    } as Data<E[Rel], Rel>;
  }

  transformRelationshipsData(data: E): Relationships<E> {
    const entity = data.constructor as unknown as E;
    return this.entityPropsMapService
      .getRelPropsForEntity(entity)
      .reduce((acum: any, val: any) => {
        const result: {
          links: Record<string, string>;
          data?: Data<E[EntityRelation<E>], EntityRelation<E>>['data'];
        } = {
          links: {
            self: this.getLink(
              camelToKebab(this.entityPropsMapService.getNameForEntity(entity)),
              data[
                this.entityPropsMapService.getPrimaryColumnsForEntity(
                  entity
                ) as keyof E
              ] as string,
              'relationships',
              val
            ),
          },
        };

        if (val in data) {
          const { data: dataRelationships } = this.getRelationships(
            data,
            val as EntityRelation<E>
          );
          if (Array.isArray(dataRelationships)) {
            result['data'] = dataRelationships;
          }

          if (!Array.isArray(dataRelationships)) {
            result['data'] = dataRelationships;
          }
        }
        acum[val.toString()] = result;
        return acum;
      }, {} as Record<string, unknown>) as Relationships<E>;
  }

  getData<T = string>(type: T, id: number | string): MainData<T> {
    return {
      type,
      id: id.toString(),
    };
  }
}
