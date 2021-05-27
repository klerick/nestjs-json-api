import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { paramCase } from 'param-case';

import { JSON_API_CONFIG } from '../../constants';
import { mixin } from '../../helpers/mixin';
import {
  ResponseResourceData,
  JsonApiTransform,
  RepositoryMixin,
  TransformMixin,
  ModuleConfig,
  Entity
} from '../../types';


export function transformMixin(entity: Entity, connectionName: string): TransformMixin {
  @Injectable()
  class MixinTransform implements JsonApiTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(JSON_API_CONFIG) protected config: ModuleConfig;

    public transformData(data: ObjectLiteral): ResponseResourceData {
      const { metadata } = this.getRepository(data.constructor.name);
      const relations = this.getRelations(metadata);

      const relationships = relations.reduce((accum, relation) => {
        accum[relation] = {};
        const builtLinks = {
          self: this.getRelationshipLink(paramCase(metadata.name), data.id, relation),
          related: this.getDirectLink(paramCase(metadata.name), data.id, relation),
        };

        if (data[relation] !== undefined) {
          let builtData;
          if (Array.isArray(data[relation])) {
            builtData = data[relation].map(relationData => ({
              type: paramCase(this.getRepository(relationData.constructor.name).metadata.name),
              id: relationData.id.toString()
            }));

          } else if(data[relation] !== null) {
            builtData = {
              type: paramCase(this.getRepository(data[relation].constructor.name).metadata.name),
              id: data[relation].id.toString()
            };

          } else {
            builtData = null;
          }

          accum[relation].data = builtData;
        }

        accum[relation].links = builtLinks;

        return accum;
      }, {});

      const attributes = Object
        .entries(data)
        .filter(([key, val]) => {
          return key !== 'id' && !relations.find(rel => rel === key);
        })
        .reduce((accum, [key, val]) => {
          accum[key] = val;
          return accum;
        }, {});

      const result = {
        id: data.id.toString(),
        type: paramCase(metadata.name),
        attributes,
        relationships,
        links: {
          self: this.getResourceLink(paramCase(metadata.name), data.id.toString()),
        }
      };

      if (Object.keys(relationships).length === 0) {
        delete result.relationships;
      }

      return result;
    }

    public transformInclude(data: ObjectLiteral): ResponseResourceData[] {
      const { metadata } = this.getRepository(data.constructor.name);
      const relations = this.getRelations(metadata);

      return Object
        .entries(data)
        .filter(([key, value]) => {
          return relations.find(relation => relation === key) && !!value;
        })
        .reduce((accum, [key, val]) => {
          accum.push(...(Array.isArray(val) ? val : [val]));
          return accum;
        }, [])
        .map(value => this.transformData(value));
    }

    public getRelationshipLink(
      resourceName: string,
      resourceId: string,
      relationName: string,
    ): string {
      const prefix = this.config.globalPrefix ? `/${this.config.globalPrefix}/` : '/';
      return `${prefix}${resourceName}/${resourceId}/relationships/${relationName}`;
    }

    public getResourceLink(
      resourceName: string,
      resourceId: string,
    ): string {
      const prefix = this.config.globalPrefix ? `/${this.config.globalPrefix}/` : '/';
      return `${prefix}${resourceName}/${resourceId}`;
    }

    public getDirectLink(
      resourceName: string,
      resourceId: string,
      relationName: string,
    ): string {
      const prefix = this.config.globalPrefix ? `/${this.config.globalPrefix}/` : '/';
      return `${prefix}${resourceName}/${resourceId}/${relationName}`;
    }

    protected getRepository(name: string): Repository<any> {
      return this.repository.manager.getRepository(name);
    }

    protected getRelations(metadata): string[] {
      return metadata.relations.map(
        relation => relation.propertyPath
      );
    }
  }

  return mixin(MixinTransform);
}
