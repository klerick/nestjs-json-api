import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import { ValidationError } from '../../../types';


export async function checkResourceBodyStructure(
  value: any,
  entityMetadata: EntityMetadata,
  isNullableRelationships = false,
  isIdentifierRequired = true,
): Promise<ValidationError[]> {
  const errorMessages: ValidationError[] = [];

  if (value) {
    const resourceName = paramCase(entityMetadata.name);
    const { type, id } = value;

    if (isIdentifierRequired) {
      if (!id) {
        errorMessages.push({
          source: { pointer: '/data' },
          detail: "Data must have an 'id' definition",
        });
      }

      if (id && (Number.isNaN(parseInt(id, 10)) || `${parseInt(id, 10)}` !== id)) {
        errorMessages.push({
          source: { pointer: '/data/id' },
          detail: "Data 'id' definition is not a number",
        });
      }
    }

    if (!type) {
      errorMessages.push({
        source: { pointer: '/data' },
        detail: "Data must have a 'type' definition",
      });
    }

    if (type && (resourceName !== type)) {
      errorMessages.push({
        source: { pointer: '/data/type' },
        detail: `Data 'type' definition is not equal to the '${resourceName}' relation`,
      });
    }

  } else {
    errorMessages.push({
      source: { pointer: '' },
      detail: "Body must have a 'data' definition",
    });
  }

  if (value && (value.attributes !== undefined)) {
    if ((typeof value.attributes !== 'object') || value.attributes === null) {
      errorMessages.push({
        source: { pointer: '/data/attributes' },
        detail: 'Attributes field definition must be an object',
      });
    }
  }

  if (value && (value.relationships !== undefined)) {
    if ((typeof value.relationships !== 'object') || value.relationships === null) {
      errorMessages.push({
        source: { pointer: '/data/relationships' },
        detail: 'Relationships field definition must be an object',
      });

    } else {
      Object
        .entries(value.relationships)
        .forEach(([key, value]: [string, any])=> {
          if ((typeof value !== 'object') || value === null) {
            errorMessages.push({
              source: { pointer: `/data/relationships/${key}` },
              detail: `Relationship '${key}' definition must be an object`,
            });
            return;
          }

          if (value.data === undefined) {
            errorMessages.push({
              source: { pointer: `/data/relationships/${key}/data` },
              detail: `Relationship '${key}' must have 'data' field`,
            });
            return;
          }

          if (isNullableRelationships) {
            if ((typeof value.data !== 'object') && value.data !== null) {
              errorMessages.push({
                source: { pointer: `/data/relationships/${key}/data` },
                detail: `Relationship '${key}' data must be an object, array or null`,
              });
            }

          } else if ((typeof value.data !== 'object') || value.data === null) {
            errorMessages.push({
              source: { pointer: `/data/relationships/${key}/data` },
              detail: `Relationship '${key}' data must be an object or array`,
            });
          }
        });
    }
  }

  return errorMessages;
}
