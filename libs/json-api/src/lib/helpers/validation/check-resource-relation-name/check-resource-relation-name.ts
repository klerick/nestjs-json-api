import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import { ValidationError } from '../../../types';


export async function checkResourceRelationName(
  relationName: string,
  entityMetadata: EntityMetadata,
): Promise<ValidationError[]> {
  const relation = entityMetadata.relations.find(relation => {
    return relation.propertyPath === relationName;
  });

  if (!relation) {
    const name = paramCase(entityMetadata.name);
    return [{
      detail: `Relation '${relationName}' does not exist in resource '${name}'`,
    }];
  }

  return [];
}
