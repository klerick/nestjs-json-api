import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

import { EntityParam } from '../../../../types';
import { nonEmptyObject, getValidationErrorForStrict } from '../zod-utils';
import { EntityParamMapService } from '../../service';
import { transformStringToArray } from '../map-transform-to-json-shema';

export const zodFieldSelectRule = z
  .string()
  .optional()
  .transform(transformStringToArray)
  .meta({ id: 'FieldSelectRule' });

export type ZodRule = z.infer<typeof zodFieldSelectRule>;
type CastPropertyKey<T> = T extends PropertyKey ? T : never;
type ZorRelationType<E extends object, IdKey extends string> = Record<CastPropertyKey<EntityParam<E, IdKey>['relations'][number]>, ZodRule>;

export function zodFieldsInputQuerySwagger<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  const {relations} = entityParamMapService.entityParaMap;

  const relation = relations.reduce(
    (acum, item) => ({
      ...acum,
      [item as PropertyKey]: zodFieldSelectRule,
    }),
    {} as ZorRelationType<E, IdKey>
  );

  return z
    .strictObject(
      {
        target: zodFieldSelectRule,
        ...relation,
      },
      {
        error: (err) =>
          err.code === 'unrecognized_keys'
            ? getValidationErrorForStrict(
                [
                  'target',
                  ...(entityParamMapService.entityParaMap
                    .relations as string[]),
                ],
                'Fields'
              )
            : err.message,
      }
    )
    .refine(nonEmptyObject(), {
      message: 'Validation error: Need select field for target or relation',
    })
    .optional();
}

export function zodFieldsInputQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return zodFieldsInputQuerySwagger(entityParamMapService)
    .transform((input) => {
      if (!input) return null;

      const result = ObjectTyped.entries(input).reduce(
        (acum, entries) => {
          const [key, value] = entries as unknown as [
            key: keyof typeof input,
            ZodRule
          ];

          if (!value || value.length === 0) return acum;

          return {
            ...acum,
            [key]: value,
          };
        },
        {} as typeof input
      );

      return Object.keys(result).length > 0 ? result : null;
    });
}

export type ZodFieldsInputQuery<
  E extends object,
  IdKey extends string
> = z.infer<ReturnType<typeof zodFieldsInputQuery<E, IdKey>>>;
