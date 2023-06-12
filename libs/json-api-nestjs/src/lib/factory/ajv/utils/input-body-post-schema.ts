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
    relationUuids: { [key: string]: { [key: string]: boolean } };
  }
): typeof inputBodySchemaJson {
  const json: typeof inputBodySchemaJson = JSON.parse(
    JSON.stringify(inputBodySchemaJson)
  );
  json.$id = `${json.$id}/${schemaName}`;
  json.properties.data.properties.type.enum.push(
    camelToKebab(getEntityName(entity))
  );

  const baseRelDataType: Record<string, any> = {
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
        case Object:
          dataType = {
            type: 'object',
          };
          break;
        default:
          dataType = {
            type: 'string',
          };
      }
      acum[item] = arrayPropsConfig.arrayProps[item] === false ? dataType : arrayPropsConfig.arrayProps[item];
      return acum;
    }, {});

  json.properties.data.properties.attributes.properties = {
    ...json.properties.data.properties.attributes.properties,
    ...attributes,
  };

  const uuidRelations = arrayPropsConfig.relationUuids || {};
  const relationships = Object.keys(relationsField).reduce((acum, item) => {
    const relDataType = {
      [item]: {
        ...baseRelDataType,
        properties: {
          ...baseRelDataType.properties,
          data: {
            ...baseRelDataType.properties.data,
            properties: {
              ...baseRelDataType.properties.data.properties,
              id: {
                ...baseRelDataType.properties.data.properties.id,
                pattern: uuidRelations[item]?.id
                  ? '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                  : '^\\d+$',
                ...(uuidRelations[item]?.id
                  ? {
                      minLength: 36,
                      maxLength: 36,
                    }
                  : {}),
                description: uuidRelations[item]?.id
                  ? 'Use string should be as uuid string'
                  : 'Use string should be as number string',
              },
            },
          },
        },
      },
    };

    const resultSchema = {
      ...relDataType[item].properties.data,
      properties: {
        ...relDataType[item].properties.data.properties,
        type: {
          ...relDataType[item].properties.data.properties.type,
          ...(arrayPropsConfig.relationType[item]
            ? {
                enum: [
                  camelToKebab(
                    getEntityName(arrayPropsConfig.relationType[item])
                  ),
                ],
              }
            : {}),
        },
      },
    };

    acum[item] = {
      ...relDataType[item],
      properties: {
        ...relDataType[item].properties,
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
