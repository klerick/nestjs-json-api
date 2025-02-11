import { ObjectTyped } from '../../../../utils/nestjs-shared';
import { z } from 'zod';

import { ObjectLiteral } from '../../../../types';
import { ResultGetField, ZodInfer } from '../../types';
import { nonEmptyObject, getValidationErrorForStrict } from '../zod-utils';

function getZodRules() {
  return z
    .string()
    .optional()
    .transform((input) => (input ? input.split(',') : undefined));
}

type ZodRule = ReturnType<typeof getZodRules>;

export function zodFieldsInputQuery<E extends ObjectLiteral>(
  relationList: ResultGetField<E>['relations']
) {
  const target = z.object({
    target: getZodRules(),
  });

  const relation = relationList.reduce(
    (acum, item) => ({
      ...acum,
      [item]: getZodRules(),
    }),
    {} as {
      [K in ResultGetField<E>['relations'][number]]: ZodRule;
    }
  );

  return target
    .merge(z.object(relation))
    .strict(getValidationErrorForStrict(['target', ...relationList], 'Fields'))
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

export type ZodFieldsInputQuery<E extends ObjectLiteral> = ZodInfer<
  typeof zodFieldsInputQuery<E>
>;
