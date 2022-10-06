import {Entity} from '../../../types';
import {inputBodyPostSchema} from './';

export function inputBodyPatchSchema(
  entity: Entity,
  fieldsArray: string[],
  relationsField: Record<string, string[]>,
  schemaName: string,
  arrayPropsConfig: {
    arrayProps: { [key: string]: boolean },
    relationArrayProps: { [key: string]: { [key: string]: boolean } },
    relationType: {
      [key: string]: Function | string
    }
  }
): ReturnType<typeof inputBodyPostSchema> {

  const json = inputBodyPostSchema(
    entity,
    fieldsArray,
    relationsField,
    schemaName,
    arrayPropsConfig
  );
  json.properties.data.properties = {
    ...{
      id: {
        type: "string",
        pattern: '^\\d+$',
        description: "Use string should be as number string"
      },
    },
    ...json.properties.data.properties
  }
  json.properties.data.required.push('id');
  json.properties.data.properties.relationships.properties = {
    ...json.properties.data.properties.relationships.properties,
    ...Object.keys(json.properties.data.properties.relationships.properties).reduce((acum, key) => {
      const data = json.properties.data.properties.relationships.properties[key].properties.data;
      const propertiesData = {
        data: {}
      }
      if (data.type === 'array') {
        const {minItems, ...otherProps} = data;
        propertiesData.data = otherProps
      } else {
        propertiesData.data = {
          oneOf: [
            {type: "null"},
            data
          ]
        }
      }
      acum[key] = {
        ...json.properties.data.properties.relationships.properties[key],
        ...{
          properties: {
            ...json.properties.data.properties.relationships.properties[key].properties,
            ...propertiesData
          }
        },
      }
      return acum;
    }, {})
  }

  return json;
}
