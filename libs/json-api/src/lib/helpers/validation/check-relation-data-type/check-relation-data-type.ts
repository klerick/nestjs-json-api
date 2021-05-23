import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import {
  ValidationError,
  BaseData
} from '../../../types';


export async function checkRelationDataType(
  relationData: BaseData | BaseData[],
  relationMetadata: RelationMetadata,
): Promise<ValidationError[]> {
  const generalErrors = [];

  if (['one-to-one', 'many-to-one'].includes(relationMetadata.relationType) && Array.isArray(relationData)) {
    generalErrors.push({
      source: { pointer: '/data' },
      detail: `Relation '${relationMetadata.propertyName}' data definition must be an object`,
    });
  }

  if (relationMetadata.relationType === 'many-to-many') {
    if (relationData !== null && !Array.isArray(relationData)) {
      generalErrors.push({
        source: { pointer: '/data' },
        detail: `Relation '${relationMetadata.propertyName}' data definition must be an array`,
      });
    }
  }

  if (relationMetadata.relationType === 'one-to-many') {
    generalErrors.push({
      detail: `Edit relation '${relationMetadata.propertyName}' on the inverse side`,
    });
  }

  return generalErrors;
}
