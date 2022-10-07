import { Entity } from '../../../types';
import * as inputBodySchemaJson from '../schema/input-body-schema.json';
import { camelToKebab, getEntityName } from '../../../helper';

export function inputBodyPostSchema(
  entity: Entity,
  fieldsArray: string[],
  relationsField: Record<string, string[]>,
  schemaName: string,
  arrayPropsConfig: {
    arrayProps: { [key: string]: boolean };
    relationArrayProps: { [key: string]: { [key: string]: boolean } };
    relationType: {
      [key: string]: Function | string;
    };
  }
): typeof inputBodySchemaJson {
  const json: typeof inputBodySchemaJson = JSON.parse(
    JSON.stringify(inputBodySchemaJson)
  );
  json.$id = `${json.$id}/${schemaName}`;
  json.properties.data.properties.type.enum.push(
    camelToKebab(getEntityName(entity))
  );

  const relDataType = {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
          },
          id: {
            type: 'string',
            pattern: '^\\d+$',
            description: 'Use string should be as number string',
          },
        },
        required: ['type', 'id'],
      },
    },
    required: ['data'],
  };

  const attributes = fieldsArray
    .filter((item) => item !== 'id')
    .reduce((acum, item) => {
      const typeMetadata = Reflect.getMetadata(
        'design:type',
        entity['prototype'],
        item
      );
      let dataType = {};
      switch (typeMetadata) {
        case Array:
          dataType = {
            type: 'array',
            items: {
              type: 'string',
            },
          };
          break;
        case Date:
          dataType = {
            type: 'string',
          };
          break;
        case Number:
          dataType = {
            type: 'integer',
          };
          break;
        case Boolean:
          dataType = {
            type: 'boolean',
          };
          break;
        default:
          dataType = {
            type: 'string',
          };
      }
      acum[item] = arrayPropsConfig.arrayProps[item]
        ? {
            type: 'array',
            items: {
              type: 'string',
            },
          }
        : dataType;
      return acum;
    }, {});

  json.properties.data.properties.attributes.properties = {
    ...json.properties.data.properties.attributes.properties,
    ...attributes,
  };

  const relationships = Object.keys(relationsField).reduce((acum, item) => {
    const resultSchema = {
      ...relDataType.properties.data,
      properties: {
        ...relDataType.properties.data.properties,
        type: {
          ...relDataType.properties.data.properties.type,
          enum: [
            camelToKebab(getEntityName(arrayPropsConfig.relationType[item])),
          ],
        },
      },
    };

    acum[item] = {
      ...relDataType,
      properties: {
        ...relDataType.properties,
        data:
          Reflect.getMetadata('design:type', entity['prototype'], item) ===
          Array
            ? {
                type: 'array',
                items: resultSchema,
                minItems: 1,
              }
            : resultSchema,
      },
    };
    return acum;
  }, {});

  json.properties.data.properties.relationships.properties = {
    ...json.properties.data.properties.relationships.properties,
    ...relationships,
  };

  json.properties.data.properties.relationships = {
    ...json.properties.data.properties.relationships,
  };

  return json;
}
