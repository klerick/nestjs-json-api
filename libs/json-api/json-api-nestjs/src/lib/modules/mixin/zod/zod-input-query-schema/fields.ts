import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

import { EntityParam } from '../../../../types';
import { nonEmptyObject, getValidationErrorForStrict } from '../zod-utils';
import { EntityParamMapService } from '../../service';

function getZodRules() {
  return z
    .string()
    .optional()
    .transform((input) => (input ? input.split(',') : undefined));
}

type ZodRule = ReturnType<typeof getZodRules>;

export function zodFieldsInputQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  const target = z.object({
    target: getZodRules(),
  });

  const relation = entityParamMapService.entityParaMap.relations.reduce(
    (acum, item) => ({
      ...acum,
      [item as PropertyKey]: getZodRules(),
    }),
    {} as {
      [K in EntityParam<E, IdKey>['relations'][number] & PropertyKey]: ZodRule;
    }
  );

  return target
    .merge(z.object(relation))
    .strict(
      getValidationErrorForStrict(
        [
          'target',
          ...(entityParamMapService.entityParaMap.relations as string[]),
        ],
        'Fields'
      )
    )
    .refine(nonEmptyObject(), {
      message: 'Validation error: Need select field for target or relation',
    })
    .optional()
    .transform((input) => {
      if (!input) return null;

      const result = ObjectTyped.entries(input).reduce((acum, [key, value]) => {
        if (!value || value.length === 0) return acum;

        return {
          ...acum,
          [key]: value,
        };
      }, {} as typeof input);

      return Object.keys(result).length > 0 ? result : null;
    });
}

export type ZodFieldsInputQuery<
  E extends object,
  IdKey extends string
> = z.infer<ReturnType<typeof zodFieldsInputQuery<E, IdKey>>>;
