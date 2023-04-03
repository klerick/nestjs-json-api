import { Entity } from '../../../types';
import { inputBodyPostSchema } from './';

export function inputBodyPatchSchema(
  entity: Entity,
  fieldsArray: string[],
  relationsField: Record<string, string[]>,
  schemaName: string,
  arrayPropsConfig: {
    arrayProps: { [key: string]: boolean };
    uuidProps: { [key: string]: boolean };
    relationArrayProps: { [key: string]: { [key: string]: boolean } };
    relationType: {
      [key: string]: Function | string;
    };
    relationUuids: { [key: string]: { [key: string]: boolean } };
  }
): ReturnType<typeof inputBodyPostSchema> {
  const json = inputBodyPostSchema(
    entity,
    fieldsArray,
    relationsField,
    schemaName,
    arrayPropsConfig
  );
  const patternObject: Record<string, string | number> = {};
  patternObject.pattern = '^\\d+$';
  patternObject.description = 'Use string should be as number string';

  if (arrayPropsConfig.uuidProps.id) {
    patternObject.pattern =
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';
    patternObject.maxLength = 36;
    patternObject.minLength = 36;
    patternObject.description = 'Use string should be as uuid string';
  }

  json.properties.data.properties = {
    ...{
      id: {
        type: 'string',
        ...patternObject,
      },
    },
    ...json.properties.data.properties,
  };
  json.properties.data.required.push('id');
  json.properties.data.properties.relationships.properties = {
    ...json.properties.data.properties.relationships.properties,
    ...Object.keys(
      json.properties.data.properties.relationships.properties
    ).reduce((acum, key) => {
      const data =
        json.properties.data.properties.relationships.properties[key].properties
          .data;
      const propertiesData = {
        data: {},
      };
      if (data.type === 'array') {
        const { minItems, ...otherProps } = data;
        propertiesData.data = otherProps;
      } else {
        propertiesData.data = {
          oneOf: [{ type: 'null' }, data],
        };
      }
      acum[key] = {
        ...json.properties.data.properties.relationships.properties[key],
        ...{
          properties: {
            ...json.properties.data.properties.relationships.properties[key]
              .properties,
            ...propertiesData,
          },
        },
      };
      return acum;
    }, {}),
  };

  return json;
}
