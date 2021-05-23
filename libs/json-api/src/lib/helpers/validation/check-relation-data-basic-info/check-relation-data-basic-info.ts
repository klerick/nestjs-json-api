import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';
import { paramCase } from 'param-case';

import {
  ValidationError,
  BaseData
} from '../../../types';


export async function checkRelationDataBasicInfo(
  relationData: BaseData | BaseData[],
  relationMetadata: RelationMetadata,
  isDataRequired = true,
): Promise<ValidationError[]> {
  const generalErrors = [];

  const valueArray = !Array.isArray(relationData) ? [relationData] : relationData;
  valueArray.forEach(item => {
    if ((item === null) && !isDataRequired) {
      return;
    }

    if (!item.id) {
      generalErrors.push({
        source: { pointer: '/data' },
        detail: "Data must have an 'id' definition",
      });
    }

    if (item.id && (Number.isNaN(parseInt(item.id, 10)) || `${parseInt(item.id, 10)}` !== item.id)) {
      generalErrors.push({
        source: { pointer: '/data/id' },
        detail: "Data 'id' definition is not a number",
      });
    }

    if (!item.type) {
      generalErrors.push({
        source: { pointer: '/data' },
        detail: "Data must have a 'type' definition",
      });
    }

    const relationTypeName = paramCase(relationMetadata.inverseEntityMetadata.name);
    if (item.type && (item.type !== relationTypeName)) {
      generalErrors.push({
        source: { pointer: '/data/type' },
        detail: `Data 'type' definition is not equal to the '${relationTypeName}' relation`,
      });
    }
  }, []);

  return generalErrors;
}
