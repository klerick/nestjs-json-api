import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityTarget } from 'typeorm';
import { EntityRelation } from '@klerick/json-api-nestjs-shared';

import { CURRENT_DATA_SOURCE_TOKEN } from '../constants';
import { ObjectLiteral as Entity } from '../../../types';
import {
  ResultGetField,
  TupleOfEntityProps,
  TupleOfEntityRelation,
} from '../../mixin/types';
import { getField } from '../orm-helper';

@Injectable()
export class EntityPropsMapService {
  @Inject(CURRENT_DATA_SOURCE_TOKEN) private dataSource!: DataSource;

  private _propsForEntity: Map<any, any> = new Map();
  private _relPropsForEntity: Map<any, any> = new Map();
  private _relTypePropsForEntity: Map<any, any> = new Map();
  private _primaryColumnsForEntity: Map<any, any> = new Map();
  private _nameForEntity: Map<any, string> = new Map();

  getPropsForEntity<E extends Entity>(entity: E): TupleOfEntityProps<E> {
    const result = this._propsForEntity.get(entity);
    if (result) {
      return result;
    }

    const { field } = this.pullPropsAndRelFoEntity(entity);

    return field;
  }

  getRelPropsForEntity<E extends Entity>(entity: E): TupleOfEntityRelation<E> {
    const result = this._relPropsForEntity.get(entity);
    if (result) {
      return result;
    }

    const { relations } = this.pullPropsAndRelFoEntity(entity);

    return relations;
  }

  getRelationPropsType<E extends Entity>(entity: E, rel: EntityRelation<E>) {
    const result = this._relTypePropsForEntity.get(entity);
    if (result) {
      return result[rel];
    }

    const repo = this.dataSource.getRepository(
      entity as unknown as EntityTarget<E>
    );
    const relToType = repo.metadata.relations.reduce((acum, item) => {
      acum[item.propertyName as keyof E] = item.inverseEntityMetadata.target;
      return acum;
    }, {} as Record<keyof E, any>);

    this._relTypePropsForEntity.set(entity, relToType);
    return relToType[rel];
  }

  getPrimaryColumnsForEntity<E extends Entity>(entity: E): keyof E {
    const result = this._primaryColumnsForEntity.get(entity);
    if (result) {
      return result as keyof E;
    }
    const primaryColumns = this.dataSource.getRepository(
      entity as unknown as EntityTarget<E>
    ).metadata.primaryColumns[0].propertyName;
    this._primaryColumnsForEntity.set(entity, primaryColumns);

    return primaryColumns as keyof E;
  }

  getNameForEntity<E extends Entity>(entity: E): string {
    const result = this._nameForEntity.get(entity);
    if (result) {
      return result;
    }
    const name = this.dataSource.getRepository(
      entity as unknown as EntityTarget<E>
    ).metadata.name;
    this._nameForEntity.set(entity, name);
    return name;
  }

  private pullPropsAndRelFoEntity<E extends Entity>(
    entity: E
  ): ResultGetField<E> {
    const repo = this.dataSource.getRepository(
      entity as unknown as EntityTarget<E>
    );

    const { relations, field } = getField(repo);
    this._propsForEntity.set(entity, field);
    this._relPropsForEntity.set(entity, relations);

    return { relations, field };
  }
}
