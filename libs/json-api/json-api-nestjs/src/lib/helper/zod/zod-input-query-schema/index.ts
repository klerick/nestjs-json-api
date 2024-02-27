import { ZodOptional } from 'zod';

import { zodFilterInputQuerySchema, ZodFilterInputQuerySchema } from './filter';
import {
  zodSelectFieldsInputQuerySchema,
  ZodSelectFieldsInputQuerySchema,
} from './select';
import {
  zodIncludeInputQuerySchema,
  ZodIncludeInputQuerySchema,
} from './include';
import { zodSortInputQuerySchema, ZodSortInputQuerySchema } from './sort';
import { zodPageInputQuerySchema, ZodPageInputQuerySchema } from './page';

import { Entity } from '../../../types';
import { QueryField } from '../zod-helper';

export type ZodInputQueryShape<E extends Entity> = {
  [QueryField.filter]: ZodOptional<ZodFilterInputQuerySchema<E>>;
  [QueryField.fields]: ZodOptional<ZodSelectFieldsInputQuerySchema<E>>;
  [QueryField.include]: ZodOptional<ZodIncludeInputQuerySchema>;
  [QueryField.sort]: ZodOptional<ZodSortInputQuerySchema>;
  [QueryField.page]: ZodPageInputQuerySchema;
};

export {
  zodIncludeInputQuerySchema,
  zodSortInputQuerySchema,
  zodPageInputQuerySchema,
  zodSelectFieldsInputQuerySchema,
  zodFilterInputQuerySchema,
};
