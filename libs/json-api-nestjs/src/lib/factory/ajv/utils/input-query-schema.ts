import { Entity } from '../../../types';
import * as inputQuerySchemaJson from '../schema/input-query-schema.json';

export function inputQuerySchema(
  entity: Entity,
  fieldsArray: string[],
  relationsField: Record<string, string[]>,
  schemaName: string
): typeof inputQuerySchemaJson {
  const json: typeof inputQuerySchemaJson = JSON.parse(
    JSON.stringify(inputQuerySchemaJson)
  );

  const relationsFieldSchema = Object.keys(relationsField).reduce<
    Record<string, unknown>
  >((acum, item) => {
    acum[item] = {
      type: 'string',
    };
    return acum;
  }, {});

  const linkFilter = {
    oneOf: [
      {
        type: 'string',
      },
      {
        $ref: `#/$defs/operand`,
      },
    ],
  };

  const linkFilterRelationField = {
    oneOf: [
      {
        type: 'string',
      },
      {
        $ref: `#/$defs/operandForRelationProps`,
      },
    ],
  };

  const fieldsFilterSchema = [
    ...fieldsArray,
    ...Object.keys(relationsField),
  ].reduce((acum, i) => ((acum[i] = linkFilter), acum), {});

  const relationFilterSchema = Object.entries(relationsField).reduce(
    (acum, [key, val]) => {
      const relationFilter = val.reduce(
        (a, i) => ((a[`${key}.${i}`] = linkFilterRelationField), a),
        acum
      );
      return val.reduce(
        (a, i) => ((a[`${key}.${i}`] = linkFilter), a),
        relationFilter
      );
    },
    {}
  );

  json.$id = `${json.$id}/${schemaName}`;
  json.properties.fields['properties'] = {
    ...json.properties.fields['properties'],
    ...{
      target: {
        type: 'string',
      },
    },
    ...relationsFieldSchema,
  };

  json.properties.filter['properties'] = {
    ...json.properties.filter['properties'],
    ...fieldsFilterSchema,
    ...relationFilterSchema,
  };

  return json;
}
