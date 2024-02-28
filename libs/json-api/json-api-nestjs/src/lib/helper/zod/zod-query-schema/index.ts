import { zodFilterQuerySchema, ZodFilterQuerySchema } from './filter';
import {
  zodSelectFieldsQuerySchema,
  ZodSelectFieldsQuerySchema,
} from './select';
import { zodIncludeQuerySchema, ZodIncludeQuerySchema } from './include';
import { zodSortQuerySchema, ZodSortQuerySchema } from './sort';
import { zodPageQuerySchema, ZodPageQuerySchema } from './page';
import { QueryField } from '../zod-helper';
import { Entity } from '../../../types';
import { ResultGetField } from '../../orm';
import { ZodNullable } from 'zod';

export {
  zodPageQuerySchema,
  ZodPageQuerySchema,
  zodIncludeQuerySchema,
  ZodIncludeQuerySchema,
  zodFilterQuerySchema,
  ZodFilterQuerySchema,
  zodSelectFieldsQuerySchema,
  ZodSelectFieldsQuerySchema,
  zodSortQuerySchema,
  ZodSortQuerySchema,
};

export type ZodQueryShape<E extends Entity> = {
  [QueryField.filter]: ZodFilterQuerySchema<E>;
  [QueryField.fields]: ZodNullable<ZodSelectFieldsQuerySchema<E>>;
  [QueryField.include]: ZodNullable<
    ZodIncludeQuerySchema<ResultGetField<E>['relations']>
  >;
  [QueryField.sort]: ZodNullable<ZodSortQuerySchema<E>>;
  [QueryField.page]: ZodPageQuerySchema;
};
