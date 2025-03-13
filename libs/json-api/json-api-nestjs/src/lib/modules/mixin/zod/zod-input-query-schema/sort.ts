import { z } from 'zod';
import { ASC, DESC } from '../../../../constants';

export function zodSortInputQuery() {
  return z
    .string()
    .optional()
    .transform((data) => {
      if (!data) return null;

      return data
        .split(',')
        .map((i) => i.trim())
        .filter((i) => !!i)
        .reduce((acum, field) => {
          const fieldName =
            field.charAt(0) === '-' ? field.substring(1) : field;
          const sort = field.charAt(0) === '-' ? DESC : ASC;
          if (fieldName.indexOf('.') > -1) {
            const [relation, fieldRelation] = field.split('.');
            const relationName =
              relation.charAt(0) === '-' ? relation.substring(1) : relation;

            acum[relationName] = acum[relationName] || {};
            acum[relationName][fieldRelation] = sort;
          } else {
            acum['target'] = acum['target'] || {};
            acum['target'][fieldName] = sort;
          }

          return acum;
        }, {} as Record<string, Record<string, typeof DESC | typeof ASC>>);
    });
}

export type ZodSortInputQuery = z.infer<ReturnType<typeof zodSortInputQuery>>;
