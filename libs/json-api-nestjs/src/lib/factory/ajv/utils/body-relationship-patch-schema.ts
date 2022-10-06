import * as bodyRelationshipPatchSchemaJson from '../schema/body-relationship-patch-schema.json';

export function bodyRelationshipPatchSchema(): typeof bodyRelationshipPatchSchemaJson {
  const json: typeof bodyRelationshipPatchSchemaJson = JSON.parse(JSON.stringify(bodyRelationshipPatchSchemaJson));
  json.$id = `${json.$id}/bodyRelationshipPatchSchema`

  return json;
}
