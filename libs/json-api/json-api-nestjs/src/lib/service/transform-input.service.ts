import { Injectable } from '@nestjs/common';

import { Entity, FilterOperand } from '../types';
import { isString } from '../helper/utils';
import { QueryField, TypeInputProps } from '../helper/zod';

import { ASC, DESC } from '../constants';

const arrayOp = {
  [FilterOperand.in]: true,
  [FilterOperand.nin]: true,
  [FilterOperand.some]: true,
};
function convertToFilterObject(
  value: Record<string, string> | string
): Partial<{
  [key in FilterOperand]: string | string[];
}> {
  if (isString<Record<string, string> | string, string>(value)) {
    return {
      [FilterOperand.eq]: value,
    };
  } else {
    return Object.entries(value).reduce((acum, [op, filed]) => {
      if (op in arrayOp) {
        acum[op] = (isString(filed) ? filed.split(',') : []).filter((i) => !!i);
      } else {
        acum[op] = filed;
      }
      return acum;
    }, {} as Record<string, string | string[]>);
  }
}

type OutPutFilter = {
  relation: null | Record<
    string,
    Record<
      string,
      Partial<{
        [key in FilterOperand]: string | string[];
      }>
    >
  >;
  target: null | Record<
    string,
    Partial<{
      [key in FilterOperand]: string | string[];
    }>
  >;
};

Injectable();
export class TransformInputService<E extends Entity> {
  public transformSort(
    data: TypeInputProps<E, QueryField.sort>
  ): Record<string, Record<string, string>> | null {
    if (!data) return null;
    return data
      .split(',')
      .map((i) => i.trim())
      .filter((i) => !!i)
      .reduce((acum, field) => {
        const fieldName = field.charAt(0) === '-' ? field.substring(1) : field;
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
      }, {} as Record<string, Record<string, string>>);
  }

  public transformInclude(
    data: TypeInputProps<E, QueryField.include>
  ): string[] | null {
    if (!data || !isString(data)) return null;
    return data
      .split(',')
      .map((i) => i.trim())
      .filter((i) => !!i);
  }

  transformFields<E extends Entity>(
    data: TypeInputProps<E, QueryField.fields>
  ): Record<string, string[]> | null {
    if (!data) return null;

    const prepareResult = Object.entries(data).reduce((acum, [key, val]) => {
      acum[key] = val
        .split(',')
        .map((i: string) => i.trim())
        .filter((i: string) => !!i);
      return acum;
    }, {} as Record<string, string[]>);

    const result = Object.entries(prepareResult).reduce(
      (acum, [key, value]) => {
        if (value.length > 0) {
          acum[key] = value;
        }
        return acum;
      },
      {} as Record<string, string[]>
    );

    return Object.keys(result).length > 0 ? result : null;
  }

  transformFilter<E extends Entity>(
    data: TypeInputProps<E, QueryField.filter>
  ): OutPutFilter | null {
    if (!data) {
      return {
        relation: null,
        target: null,
      };
    }
    return Object.entries(data).reduce(
      (acum, [field, value]: [string, any]) => {
        const objectOperand = convertToFilterObject(value);
        if (Object.keys(objectOperand).length === 0) {
          return acum;
        }

        if (field.indexOf('.') > -1) {
          const [relation, fieldRelation] = field.split('.');
          acum['relation'] = !acum['relation'] ? {} : acum['relation'];
          acum['relation'][relation] = acum['relation'][relation] || {};
          acum['relation'][relation][fieldRelation] = objectOperand;
        } else {
          acum['target'] = !acum['target'] ? {} : acum['target'];
          acum['target'][field] = objectOperand;
        }

        return acum;
      },
      { relation: null, target: null } as OutPutFilter
    );
  }
}
