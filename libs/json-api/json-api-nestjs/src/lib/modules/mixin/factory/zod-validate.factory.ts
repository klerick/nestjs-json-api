import { FactoryProvider, ValueProvider } from '@nestjs/common';

import {
  ZOD_INPUT_QUERY_SCHEMA,
  ZOD_QUERY_SCHEMA,
  ZOD_POST_SCHEMA,
  ZOD_PATCH_SCHEMA,
  ZOD_POST_RELATIONSHIP_SCHEMA,
  ZOD_PATCH_RELATIONSHIP_SCHEMA,
  ENTITY_MAP_PROPS,
} from '../../../constants';

import {
  zodInputQuery,
  ZodInputQuery,
  zodQuery,
  ZodQuery,
  ZodPost,
  zodPost,
  zodPatch,
  ZodPatch,
  zodPostRelationship,
  ZodPostRelationship,
  zodPatchRelationship,
  ZodPatchRelationship,
} from '../zod';
import { EntityClass, ObjectLiteral } from '../../../types';
import {
  AllFieldWithType,
  ArrayPropsForEntity,
  EntityProps,
  FieldWithType,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  RelationTree,
  ResultGetField,
  ZodEntityProps,
} from '../types';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

function getEntityMap<E extends ObjectLiteral>(
  entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>,
  entity: Function & { prototype: E }
) {
  const entityMap = entityMapProps.get(entity);
  if (!entityMap) throw new Error('Entity not found in map');
  return entityMap;
}

export function getParamsForOatchANdPostZod<E extends ObjectLiteral>(
  entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>,
  entity: Function & { prototype: E }
) {
  const entityMap = getEntityMap(entityMapProps, entity);

  const {
    primaryColumnType,
    typeName,
    propsType,
    primaryColumnName,
    propsNullable,
    relationProperty,
  } = entityMap;
  const fieldWithType = {} as FieldWithType<E>;
  const propsDb = {} as PropsForField<E>;
  const relationArrayProps = {} as RelationPropsArray<E>;
  const relationPopsName = {} as RelationPropsTypeName<E>;
  const primaryColumnTypeForRel = {} as RelationPrimaryColumnType<E>;

  for (const [name, type] of ObjectTyped.entries(propsType)) {
    Reflect.set(propsDb, name, {
      type: type,
      isArray: type === 'array',
      isNullable: (propsNullable as any[]).includes(name),
    });
    if (name === primaryColumnName) continue;
    Reflect.set(fieldWithType, name, type);
  }

  for (const [name, value] of ObjectTyped.entries(relationProperty)) {
    const relEntityMap = getEntityMap(entityMapProps, value.entityClass);

    Reflect.set(relationArrayProps, name, value.isArray);
    Reflect.set(relationPopsName, name, relEntityMap.className);
    Reflect.set(primaryColumnTypeForRel, name, relEntityMap.primaryColumnType);
  }

  return {
    primaryColumnType,
    typeName: typeName as any,
    fieldWithType,
    propsDb: propsDb as PropsForField<E>,
    primaryColumnName: primaryColumnName as EntityProps<E>,
    relationArrayProps,
    relationPopsName,
    primaryColumnTypeForRel,
  };
}

export function ZodInputQuerySchema<E extends ObjectLiteral>(
  entity: EntityClass<E>
): FactoryProvider<ZodInputQuery<E>> {
  return {
    provide: ZOD_INPUT_QUERY_SCHEMA,
    inject: [
      {
        token: ENTITY_MAP_PROPS,
        optional: false,
      },
    ],
    useFactory: (entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>) => {
      const entityMap = getEntityMap(entityMapProps, entity);

      const { props, relations, relationProperty } = entityMap;

      const entityRelationStructure = ObjectTyped.entries(
        relationProperty
      ).reduce((acum, [name, value]) => {
        const relMap = getEntityMap(entityMapProps, value.entityClass);
        Reflect.set(acum, name, relMap.props);
        return acum;
      }, {} as RelationTree<E>);

      return zodInputQuery<E>(
        {
          field: props,
          relations: relations,
        } as ResultGetField<E>,
        entityRelationStructure
      );
    },
  };
}

export function ZodQuerySchema<E extends ObjectLiteral>(
  entity: EntityClass<E>
): FactoryProvider<ZodQuery<E>> {
  return {
    provide: ZOD_QUERY_SCHEMA,
    inject: [
      {
        token: ENTITY_MAP_PROPS,
        optional: false,
      },
    ],
    useFactory: (entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>) => {
      const entityMap = getEntityMap(entityMapProps, entity);

      const {
        props,
        relations,
        relationProperty,
        propsType: propsTypeEntity,
      } = entityMap;

      const propsType = { ...propsTypeEntity } as AllFieldWithType<E>;

      const propsArray = { target: {} } as ArrayPropsForEntity<E>;

      for (const [name, type] of ObjectTyped.entries(propsTypeEntity)) {
        if (type !== 'array') continue;
        Reflect.set(propsArray.target, name, true);
      }

      const entityRelationStructure = {} as RelationTree<E>;
      for (const [name, value] of ObjectTyped.entries(relationProperty)) {
        const relMap = getEntityMap(entityMapProps, value.entityClass);

        if (!(name in propsArray)) {
          Reflect.set(propsArray, name, {});
        }
        for (const [relNameField, type] of ObjectTyped.entries(
          relMap.propsType
        )) {
          if (type !== 'array') continue;
          const propsArrayObject = Reflect.get(propsArray, name);
          Reflect.set(propsArrayObject, relNameField, true);
        }

        Reflect.set(propsType, name, relMap.propsType);
        Reflect.set(entityRelationStructure, name, relMap.props);
      }
      const entityFieldsStructure = {
        field: props,
        relations: relations,
      } as ResultGetField<E>;

      return zodQuery<E>(
        entityFieldsStructure,
        entityRelationStructure,
        propsArray,
        propsType
      );
    },
  };
}

export function ZodPostSchema<E extends ObjectLiteral, I extends string>(
  entity: EntityClass<E>
): FactoryProvider<ZodPost<E, I>> {
  return {
    provide: ZOD_POST_SCHEMA,
    inject: [
      {
        token: ENTITY_MAP_PROPS,
        optional: false,
      },
    ],
    useFactory: (entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>) => {
      const {
        primaryColumnType,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumnName,
        relationArrayProps,
        relationPopsName,
        primaryColumnTypeForRel,
      } = getParamsForOatchANdPostZod<E>(entityMapProps, entity);

      return zodPost<E, I>(
        primaryColumnType,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumnName,
        relationArrayProps,
        relationPopsName,
        primaryColumnTypeForRel
      );
    },
  };
}

export function ZodPatchSchema<E extends ObjectLiteral, I extends string>(
  entity: EntityClass<E>
): FactoryProvider<ZodPatch<E, I>> {
  return {
    provide: ZOD_PATCH_SCHEMA,
    inject: [
      {
        token: ENTITY_MAP_PROPS,
        optional: false,
      },
    ],
    useFactory: (entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>) => {
      const {
        primaryColumnType,
        typeName,
        fieldWithType,
        propsDb,
        primaryColumnName,
        relationArrayProps,
        relationPopsName,
        primaryColumnTypeForRel,
      } = getParamsForOatchANdPostZod<E>(entityMapProps, entity);

      return zodPatch<E, I>(
        primaryColumnType,
        typeName as I,
        fieldWithType,
        propsDb,
        primaryColumnName as EntityProps<E>,
        relationArrayProps,
        relationPopsName,
        primaryColumnTypeForRel
      );
    },
  };
}

export const ZodInputPostRelationshipSchema: ValueProvider<ZodPostRelationship> =
  {
    provide: ZOD_POST_RELATIONSHIP_SCHEMA,
    useValue: zodPostRelationship,
  };

export const ZodInputPatchRelationshipSchema: ValueProvider<ZodPatchRelationship> =
  {
    provide: ZOD_PATCH_RELATIONSHIP_SCHEMA,
    useValue: zodPatchRelationship,
  };
