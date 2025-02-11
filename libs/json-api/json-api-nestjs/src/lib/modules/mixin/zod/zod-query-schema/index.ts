import { QueryField } from '../../../../utils/nestjs-shared';
import { z, ZodObject } from 'zod';

import { ObjectLiteral } from '../../../../types';
import {
  AllFieldWithType,
  ArrayPropsForEntity,
  RelationTree,
  ResultGetField,
} from '../../types';

import { zodFieldsQuery, ZodFieldsQuery } from './fields';
import { zodFilterQuery, ZodFilterQuery } from './filter';
import { zodSortQuery, ZodSortQuery } from './sort';
import { zodIncludeQuery, ZodIncludeQuery } from './include';
import { zodPageInputQuery, ZodPageInputQuery } from '../zod-share';

type Shape<E extends ObjectLiteral> = {
  [QueryField.fields]: ZodFieldsQuery<E>;
  [QueryField.filter]: ZodFilterQuery<E>;
  [QueryField.include]: ZodIncludeQuery<E>;
  [QueryField.sort]: ZodSortQuery<E>;
  [QueryField.page]: ZodPageInputQuery;
};

function getShape<E extends ObjectLiteral>(
  entityFieldsStructure: ResultGetField<E>,
  entityRelationStructure: RelationTree<E>,
  propsArray: ArrayPropsForEntity<E>,
  propsType: AllFieldWithType<E>
): Shape<E> {
  return {
    [QueryField.fields]: zodFieldsQuery(
      entityFieldsStructure.field,
      entityRelationStructure
    ),
    [QueryField.filter]: zodFilterQuery(
      entityFieldsStructure.field,
      entityRelationStructure,
      propsArray,
      propsType
    ),
    [QueryField.include]: zodIncludeQuery(entityFieldsStructure.relations),
    [QueryField.sort]: zodSortQuery(
      entityFieldsStructure.field,
      entityRelationStructure
    ),
    [QueryField.page]: zodPageInputQuery(),
  };
}

function getZodResultSchema<E extends ObjectLiteral>(
  shape: Shape<E>
): ZodObject<Shape<E>, 'strict'> {
  return z.object(shape).strict();
}

export function zodQuery<E extends ObjectLiteral>(
  entityFieldsStructure: ResultGetField<E>,
  entityRelationStructure: RelationTree<E>,
  propsArray: ArrayPropsForEntity<E>,
  propsType: AllFieldWithType<E>
): ZodResultSchema<E> {
  const shape = getShape(
    entityFieldsStructure,
    entityRelationStructure,
    propsArray,
    propsType
  );
  return getZodResultSchema(shape);
}

export type ZodResultSchema<E extends ObjectLiteral> = ReturnType<
  typeof getZodResultSchema<E>
>;
export type ZodQuery<E extends ObjectLiteral> = ReturnType<typeof zodQuery<E>>;
export type Query<E extends ObjectLiteral> = z.infer<ZodQuery<E>>;

function zodQueryOne<E extends ObjectLiteral>(
  entityFieldsStructure: ResultGetField<E>,
  entityRelationStructure: RelationTree<E>,
  propsArray: ArrayPropsForEntity<E>,
  propsType: AllFieldWithType<E>
) {
  return z
    .object({
      [QueryField.fields]: zodFieldsQuery(
        entityFieldsStructure.field,
        entityRelationStructure
      ),
      [QueryField.include]: zodIncludeQuery(entityFieldsStructure.relations),
    })
    .strict();
}

export type ZodQueryOne<E extends ObjectLiteral> = ReturnType<
  typeof zodQueryOne<E>
>;
export type QueryOne<E extends ObjectLiteral> = z.infer<ZodQueryOne<E>>;
