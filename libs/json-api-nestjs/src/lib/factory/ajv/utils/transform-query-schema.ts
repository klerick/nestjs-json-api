import { Entity } from '../../../types';
import * as transformQuerySchemaJson from '../schema/transform-query-schema.json';

export function transformQuerySchema(
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
): typeof transformQuerySchemaJson {
  const json: typeof transformQuerySchemaJson = JSON.parse(
    JSON.stringify(transformQuerySchemaJson)
  );
  json.$id = `${json.$id}/${schemaName}`;

  const fieldSchema = fieldsArray.reduce(
    (acum, item) => {
      acum['sort'][item] = {
        $ref: '#/$defs/sortSchema',
      };
      if (arrayPropsConfig.arrayProps[item]) {
        acum['filter'][item] = {
          $ref: '#/$defs/operandForArrayProps',
        };
      } else {
        acum['filter'][item] = {
          $ref: '#/$defs/operand',
        };
      }
      acum['fields'].push(item);
      return acum;
    },
    {
      sort: {},
      fields: [],
      filter: {},
    }
  );

  const relationSchema = Object.entries(relationsField).reduce(
    (acum, [key, value]) => {
      fieldSchema['filter'][key] = {
        $ref: '#/$defs/operandForRelationProps',
      };
      acum['sort'][key] = {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: value.reduce((a, i) => {
          a[i] = {
            $ref: '#/$defs/sortSchema',
          };
          return a;
        }, {}),
      };
      acum['fields'][key] = {
        type: 'array',
        items: {
          type: 'string',
          enum: value,
        },
      };

      acum['filter'][key] = {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: value.reduce((a, i) => {
          if (arrayPropsConfig.relationArrayProps[key][i]) {
            a[i] = {
              $ref: '#/$defs/operandForArrayProps',
            };
          } else {
            a[i] = {
              $ref: '#/$defs/operand',
            };
          }
          return a;
        }, {}),
      };

      return acum;
    },
    {
      sort: {},
      fields: {},
      filter: {},
    }
  );

  json.$defs['includeDefs'].items.enum.push(...Object.keys(relationsField));

  json.$defs['sortDefs'].properties = {
    ...json.$defs['sortDefs'].properties,
    ...{
      target: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          ...fieldSchema.sort,
        },
      },
      ...relationSchema.sort,
    },
  };

  json.$defs['fieldsDefs'].properties = {
    ...json.$defs['fieldsDefs'].properties,
    ...{
      target: {
        type: 'array',
        items: {
          type: 'string',
          enum: fieldSchema.fields,
        },
      },
    },
    ...relationSchema.fields,
  };

  json.$defs['filterTarget'].properties = {
    ...json.$defs['filterTarget'].properties,
    ...fieldSchema.filter,
  };
  json.$defs['filterRelation'].properties = {
    ...json.$defs['filterRelation'].properties,
    ...relationSchema.filter,
  };

  return json;
}
