import { OpenAPIObject } from '@nestjs/swagger';

/**
 * @nestjs/swagger exposes only `.`, `./plugin` and `./package.json` through its
 * exports map, and its root barrel re-exports just `ApiTagOptions` and
 * `OpenAPIObject` out of the OpenAPI spec interfaces. The schema types are
 * therefore derived from `OpenAPIObject` rather than reached for through a deep
 * import, which stops resolving the moment the package tightens its exports.
 *
 * `components.schemas` is typed as `Record<string, SchemaObject |
 * ReferenceObject>`, and a reference is the only member carrying `$ref`, so the
 * union splits cleanly.
 */
type SchemaOrReference = NonNullable<
  NonNullable<OpenAPIObject['components']>['schemas']
>[string];

export type ReferenceObject = Extract<SchemaOrReference, { $ref: string }>;
export type SchemaObject = Exclude<SchemaOrReference, ReferenceObject>;
