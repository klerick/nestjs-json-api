import { EntityMetadata } from 'typeorm';
import { paramCase } from 'param-case';

import {
  RequestResourceData,
  ValidationError
} from '../../../types';


export async function checkResourceRelationsData(
  resourceData: RequestResourceData,
  entityMetadata: EntityMetadata,
  isDataRequired = true,
): Promise<ValidationError[]> {
  return Object
    .entries(resourceData.relationships)
    .reduce<ValidationError[]>((accum, [key, value]) => {
      if (isDataRequired && !value.data) {
        accum.push({
          source: { pointer: `/data/relationships/${key}` },
          detail: "Relation must have a 'data' definition",
        });
        return accum;
      }

      if (value.data === null) {
        return accum;
      }

      const data = Array.isArray(value.data) ? value.data : [value.data];
      data.forEach(item => {
        const { type, id } = item;

        if (!item.id) {
          accum.push({
            source: { pointer: `/data/relationships/${key}/data` },
            detail: "Data must have an 'id' definition",
          });
        }

        if (id && (Number.isNaN(parseInt(id, 10)) || `${parseInt(id, 10)}` !== `${id}`)) {
          accum.push({
            source: { pointer: `/data/relationships/${key}/data/id` },
            detail: "Data 'id' definition is not a number",
          });
        }

        if (!type) {
          accum.push({
            source: { pointer: `/data/relationships/${key}/data` },
            detail: "Data must have a 'type' definition",
          });
        }

        const meta = entityMetadata.relations.find(relation => relation.propertyPath === key);
        const typeName = paramCase(meta.inverseEntityMetadata.name);

        if (type && (typeName !== type)) {
          accum.push({
            source: { pointer: `/data/relationships/${key}/data/type` },
            detail: `Data 'type' definition is not equal to the '${typeName}' relation`,
          });
        }
      });

      return accum;
    }, []);
}
