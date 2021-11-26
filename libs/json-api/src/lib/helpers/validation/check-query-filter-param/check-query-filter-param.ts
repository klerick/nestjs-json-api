import { EntityMetadata } from 'typeorm';

import { checkEntityFieldMetadata } from '..';
import { FilterOperand, OperandsMap, QueryField, QueryParams, ValidationError } from '../../../types';


export async function checkQueryFilterParam(
  queryParams: QueryParams,
  entityMetadata: EntityMetadata,
): Promise<ValidationError[]> {
  const relations = entityMetadata.relations.map(item => item.propertyPath);
  const arrayColumns = entityMetadata.columns.filter(item => item.isArray).map((prop) => prop.propertyPath);
  const errors: ValidationError[] = [];

  (Object.entries(queryParams[QueryField.filter] || {})).forEach(([name, value]) => {
    const [operand, filterValue] = Object.entries(value).pop();
    if (relations.includes(name) && (name.split('.').length === 1)) {
      if (![FilterOperand.eq, FilterOperand.ne].includes(operand as FilterOperand)) {
        errors.push({
          detail: `Allowed only '${FilterOperand.eq}' and '${FilterOperand.ne}' operands in field '${name}'`,
          source: {
            parameter: QueryField.filter,
          },
        });
        return;
      }

      if (filterValue !== 'null') {
        errors.push({
          detail: `You can use only 'null' value in field '${name}'`,
          source: {
            parameter: QueryField.filter,
          },
        });
        return;
      }

    } else {
      if (arrayColumns.includes(name)) {
        if (operand !== FilterOperand.some) {
          errors.push({
            detail: `Incorrect operand '${operand}' in array field '${name}'`,
            source: {
              parameter: QueryField.filter,
            },
          });
          return;
        }
      } else {
        if (operand === FilterOperand.some) {
          errors.push({
            detail: `Incorrect operand '${operand}' in non-array field '${name}'`,
            source: {
              parameter: QueryField.filter,
            },
          });
          return;
        }
      }

      if (!OperandsMap[operand]) {
        errors.push({
          detail: `Incorrect operand '${operand}' in field '${name}'`,
          source: {
            parameter: QueryField.filter,
          },
        });
        return;
      }
    }

    errors.push(
      ...checkEntityFieldMetadata(name, queryParams, entityMetadata, QueryField.filter)
    );
  });

  return errors;
}


