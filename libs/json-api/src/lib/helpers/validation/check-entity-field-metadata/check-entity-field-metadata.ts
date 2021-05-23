import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import {
  ValidationError,
  QueryParams,
  QueryField,
} from '../../../types';


export function checkEntityFieldMetadata(
  name: string,
  queryParams: QueryParams,
  entityMetadata: EntityMetadata,
  sourceParameter: QueryField,
): ValidationError[] {
  let primaryColumns = entityMetadata.primaryColumns.map((prop) => prop.propertyPath);
  const relations = entityMetadata.relations.map((prop) => prop.propertyPath);
  let columns = entityMetadata.columns.map((prop) => prop.propertyPath);
  const errors: ValidationError[] = [];

  if (name.split('.').length === 1) {
    if (![...columns, ...primaryColumns, ...relations].find((i) => i === name)) {
      errors.push({
        detail: `Field '${name.toLocaleLowerCase()}' does not exist`,
        source: {
          parameter: sourceParameter,
        },
      });
    }

    if (queryParams[QueryField.include] && Array.isArray(queryParams[QueryField.include])) {
      if (relations.includes(name) && !queryParams[QueryField.include].includes(name)) {
        errors.push({
          detail: `Add '${name}' to query param 'include'`,
          source: {
            parameter: sourceParameter,
          },
        });
      }
    }

    return errors;
  }

  if (name.split('.').length > 2) {
    errors.push({
      detail: `Field '${name.toLocaleLowerCase()}' incorrect format`,
      source: {
        parameter: sourceParameter,
      },
    });
    return errors;
  }

  const [relation, column] = name.split('.');
  if (paramCase(entityMetadata.name) === relation) {
    const nestedErrors = checkEntityFieldMetadata(
      column,
      queryParams,
      entityMetadata,
      sourceParameter,
    );
    errors.push(...nestedErrors);
    return errors;
  }

  if (!entityMetadata.relations.find(item => item.propertyPath === relation)) {
    errors.push({
      detail: `Relation '${paramCase(relation)}' does not exist`,
      source: {
        parameter: sourceParameter,
      },
    });
    return errors;
  }

  if (queryParams[QueryField.include] && Array.isArray(queryParams[QueryField.include])) {
    if (!queryParams[QueryField.include].find(item => item === relation)) {
      errors.push({
        detail: `Add '${paramCase(relation)}' to query param 'include'`,
        source: {
          parameter: sourceParameter,
        },
      });
      return errors;
    }
  }

  const relationMetadata = entityMetadata.relations.find(item => item.propertyPath === relation);
  primaryColumns = relationMetadata.inverseEntityMetadata.primaryColumns.map((prop) => prop.propertyPath);
  columns = relationMetadata.inverseEntityMetadata.columns.map((prop) => prop.propertyPath);
  if (![...columns, ...primaryColumns].find((i) => i === column)) {
    errors.push({
      detail: `Relation: '${paramCase(relation)}' in resource '${paramCase(entityMetadata.name)}' ` +
        `does not have field '${column.toLocaleLowerCase()}'`,
      source: {
        parameter: sourceParameter,
      },
    });
    return errors;
  }

  return errors;
}
