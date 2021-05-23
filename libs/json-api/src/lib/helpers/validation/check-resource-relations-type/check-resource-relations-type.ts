import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import {
  RequestResourceData,
  ValidationError
} from '../../../types';


export async function checkResourceRelationsType(
  resourceData: RequestResourceData,
  entityMetadata: EntityMetadata,
  isDataRequired = true,
): Promise<ValidationError[]> {
  return Object
    .entries(resourceData.relationships)
    .reduce<ValidationError[]>((accum, [key, value]) => {
      const relation = entityMetadata.relations.find(relation => relation.propertyName === key);
      if (!relation) {
        accum.push({
          source: { pointer: '/data/relationships' },
          detail: `Relation '${paramCase(key)}' does not exist`,
        });
        return accum;
      }

      const { relationType, propertyName } = relation;

      if (relationType === 'one-to-many') {
        accum.push({
          source: { pointer: `/data/relationships/${propertyName}` },
          detail: `Edit relation '${propertyName}' on the inverse side`,
        });
      }

      if (!isDataRequired && value.data === null) {
        return accum;
      }

      if (['one-to-one', 'many-to-one'].includes(relationType) && Array.isArray(value.data)) {
        accum.push({
          source: { pointer: `/data/relationships/${propertyName}/data` },
          detail: `Relation '${propertyName}' data definition must be an object`,
        });
      }

      if (relationType === 'many-to-many') {
        if (value.data !== null && !Array.isArray(value.data)) {
          accum.push({
            source: { pointer: `/data/relationships/${propertyName}/data` },
            detail: `Relation '${propertyName}' data definition must be an array`,
          });
        }
      }

      return accum;
    }, []);
}
