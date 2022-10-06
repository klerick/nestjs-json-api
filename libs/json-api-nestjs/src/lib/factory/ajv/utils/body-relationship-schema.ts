import * as bodyRelationshipSchemaJson from '../schema/body-relationship-schema.json';

export function bodyRelationshipSchema(): typeof bodyRelationshipSchemaJson{
  const json: typeof bodyRelationshipSchemaJson = JSON.parse(JSON.stringify(bodyRelationshipSchemaJson));
  json.$id = `${json.$id}/bodyRelationshipSchema`

  return json;
}
