import {ApplicationConfig} from '@nestjs/core';
import {VersioningType} from '@nestjs/common';
import {RoutePathFactory} from '@nestjs/core/router/route-path-factory';
import {plainToClass} from 'class-transformer';

import {Repository} from 'typeorm';
import {ConfigParam, Entity} from '../../../types';
import {snakeToCamel, camelToKebab, getEntityName} from '../../../helper';
import {Attributes, Relationships, ResourceData, ResourceObject} from '../../../types-common';

export class TransformMixinService<T> {

  private currentResourceName = snakeToCamel(this.repository.metadata.name);
  private currentPrimaryField = this.repository.metadata.primaryColumns[0].propertyName;
  private relationPrimaryField: Map<string, string> = this.repository.metadata.relations
    .reduce((acum, item) => {
      const relationMetadata = this.repository.manager.getRepository(item.inverseEntityMetadata.target).metadata;
      acum.set(
        item.propertyName,
        relationMetadata.primaryColumns[0].propertyName
      )
      return acum;
    }, new Map<string, string>)
  private relationColumns: Set<string> = this.repository.metadata.relations
    .reduce((a, i) => (a.add(i.propertyName), a), new Set<string>());
  private commonColumns: Set<string> = this.repository.metadata.columns
    .map(i => i.propertyName)
    .filter(i => !this.relationColumns.has(i))
    .reduce((a, i) => (a.add(i), a), new Set<string>());

  private commonColumnsForRelation: Map<string, Set<string>> = this.repository.metadata.relations
    .reduce((acum, item) => {
      const relationMetadata = this.repository.manager.getRepository(item.inverseEntityMetadata.target).metadata;
      const relation = relationMetadata.relations.map(i => i.propertyName);
      const columns = relationMetadata.columns
        .filter(i => !relation.includes(i.propertyName))
        .reduce((a, i) => (a.add(i.propertyName), a), new Set<string>())
      acum.set(
        item.propertyName,
        columns
      )
      return acum;
    }, new Map<string, Set<string>>)

  private relationColumnsForRelation: Map<string, Set<string>> = this.repository.metadata.relations
    .reduce((acum, item) => {
      const relationMetadata = this.repository.manager.getRepository(item.inverseEntityMetadata.target).metadata;
      const columns = relationMetadata.relations
        .reduce((a, i) => (a.add(i.propertyName), a), new Set<string>())
      acum.set(
        item.propertyName,
        columns
      )
      return acum;
    }, new Map<string, Set<string>>);

  private relationTarget: Map<string, Entity> = this.repository.metadata.relations.reduce((acum, item) => {
    acum[item.propertyName] = item.inverseEntityMetadata.target;
    acum.set(item.propertyName, item.inverseEntityMetadata.target as Function)
    return acum;
  }, new Map<string, Entity>);

  private isArrayRelations: Record<string, boolean> = this.repository.metadata
    .relations
    .reduce((acum, i) => {
      switch (i.relationType) {
        case 'one-to-one':
        case 'one-to-many':
          acum[i.propertyName] = false;
          break;
        case 'many-to-many':
        case 'many-to-one':
          acum[i.propertyName] = true;
          break;
      }
      return acum;
    }, {});

  private routePathFactory?: RoutePathFactory;

  constructor(
    protected repository: Repository<T>,
    protected config: ConfigParam,
    protected applicationConfig: ApplicationConfig
  ) {

  }

  transformRawData(data: any): T[] {
    const countData = data.length;
    const dataJson: Record<string, T> = {};

    const currentRawPrimaryField = `${this.currentResourceName}_${this.currentPrimaryField}`;

    for (let i = 0; i < countData; i++) {
      const currentItem = data[i]
      const currentId = currentItem[currentRawPrimaryField].toString();
      dataJson[currentId] = dataJson[currentId] || {} as any;
      const mainObject = {};
      const relationObject = {}
      for (const field in currentItem) {
        const [tableName, ...other] = field.split('_');
        const fieldName = snakeToCamel(other.join('_'));
        if (tableName === this.currentResourceName && this.commonColumns.has(fieldName)) {
          mainObject[fieldName] = currentItem[field];
        }
        if (this.commonColumnsForRelation.has(tableName) && this.commonColumnsForRelation.get(tableName).has(fieldName)) {
          if (!currentItem[field]) {
            continue;
          }
          relationObject[tableName] = relationObject[tableName] || {};
          relationObject[tableName][fieldName] = currentItem[field];
        }
      }
      dataJson[currentId] = {
        ...dataJson[currentId],
        ...mainObject,
        ...Object.entries(relationObject).reduce((acum, [key, val]) => {
          if (!acum[key]) {
            acum[key] = this.isArrayRelations[key] ? [] : {}
          }
          const plainObject = plainToClass(this.relationTarget.get(key) as any,val);
          if (Array.isArray(acum[key])) {
            acum[key].push(plainObject)
          } else {
            acum[key] = plainObject
          }
          return acum;
        }, dataJson[currentId])
      }

    }

    return Object.values(dataJson).map(i => plainToClass(this.repository.target as any, i));

  }

  transformData<T>(data: T, include: string[] = [], table = this.currentResourceName,): ResourceData<T> {
    const urlTable = camelToKebab(table);
    const attributes = {} as Attributes<Omit<T, 'id'>>;
    const relationships = {} as Partial<Relationships<T>>;

    const relationList = table === this.currentResourceName ? this.relationColumns : this.relationColumnsForRelation.get(table);

    for (const field in data) {
      if (field !== 'id' && !relationList.has(field)) {
        attributes[field as string] = data[field];
      }

      if (relationList.has(field)) {
        const builtData = {
          data: undefined
        };
        const propsData = data[field];
        const typeName = getEntityName(this.relationTarget.get(field));
        if (Array.isArray(propsData)) {
          builtData.data = propsData.map(i => ({
            type: camelToKebab(typeName),
            id: i[this.relationPrimaryField.get(field)].toString()
          }))
        }

        if (!Array.isArray(data[field]) && typeof data[field] !== 'undefined') {
          builtData.data = {
            type: camelToKebab(typeName),
            id: data[field][this.relationPrimaryField.get(field)].toString()
          }
        }

        relationships[field as string] = {
          ...(include.includes(field) && builtData.data ? builtData : {}),
          links: {
            self: this.getLink(urlTable, data[this.relationPrimaryField.get(field)], 'relationships', camelToKebab(field)),
            related: this.getLink(urlTable, data[this.relationPrimaryField.get(field)], camelToKebab(field)),
          }
        };
      }
    }
    for (const itemRelation of relationList.values()) {
      const field = camelToKebab(itemRelation);
      if (relationships[itemRelation] ) {
        continue;
      }
      relationships[itemRelation as string] = {
        links: {
          self: this.getLink(urlTable, data[this.relationPrimaryField.get(itemRelation)], 'relationships', field),
          related: this.getLink(urlTable, data[this.relationPrimaryField.get(itemRelation)], field),
        }
      };
    }

    return {
      id: data[this.currentPrimaryField].toString(),
      type: urlTable,
      attributes,
      relationships,
      links: {
        self: this.getLink(urlTable, data['id'])
      }
    };
  }

  transformInclude<T>(data: T[]): ResourceObject<T>['included'] {
    const result = {};
    for (const itemRow of data) {
      const needField = Object.keys(itemRow)
        .filter(i => this.relationColumns.has(i));
      for (const field of needField) {
        if (!itemRow[field] || (Array.isArray(itemRow[field]) && itemRow[field].lenght > 0)) {
          continue;
        }

        result[field] = result[field] || {}
        const includeArray = Array.isArray(itemRow[field]) ? itemRow[field] : [itemRow[field]];

        for (const includeItem of includeArray) {
          const {id} = includeItem
          if (result[field][id]) {
            continue;
          }
          result[field][id] = includeItem;
        }
      }
    }

    return Object.keys(result).reduce<ResourceObject<T>['included']>((acum, item) => {
      const items = Object.values<T>(result[item]);
      acum.push(
        ...items.map(i => this.transformData(i, [], item)) as any
      )
      return acum;
    }, [])

  }

  private getPrefixArray(): string[] {
    const urlPath = [''];
    const prefix = this.applicationConfig.getGlobalPrefix();
    const version = this.applicationConfig.getVersioning();

    this.routePathFactory = new RoutePathFactory(this.applicationConfig);

    if (prefix) {
      urlPath.push(this.applicationConfig.getGlobalPrefix())
    }
    if (version && version.type === VersioningType.URI) {
      const firstVersion = Array.isArray(version.defaultVersion) ? version.defaultVersion[0] : version.defaultVersion;
      if (firstVersion) {
        urlPath.push(
          `${this.routePathFactory.getVersionPrefix(version)}${firstVersion.toString()}`
        );
      }
    }
    return urlPath;
  }

  private getLink(...partOfUrl: string[]) {
    const urlPath = this.getPrefixArray();
    urlPath.push(...partOfUrl)
    return urlPath.join('/');
  }
}

