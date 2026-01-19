/**
 * Marker type for fields that should be excluded from POST/PATCH input.
 * Use with @JsonApiReadOnly() decorator for runtime exclusion.
 *
 * For FK fields (relationFkField), only the type marker is needed
 * since runtime exclusion is handled automatically.
 *
 * @example
 * // FK field - only type marker needed
 * @Property({ persist: false })
 * public createdById!: number & Opt & JsonApiReadOnlyField;
 *
 * // Other read-only fields - decorator + type marker
 * @Property()
 * @JsonApiReadOnly()
 * public createdAt!: Date & JsonApiReadOnlyField;
 */
export type JsonApiReadOnlyField = { readonly __jsonApiReadOnly?: never };

/**
 * Extracts keys of fields marked as JsonApiReadOnlyField
 */
export type ExtractJsonApiReadOnlyKeys<T> = {
  [K in keyof T]: T[K] extends JsonApiReadOnlyField ? K : never;
}[keyof T];

/**
 * Omits JsonApiReadOnlyField fields from type
 */
export type OmitJsonApiReadOnly<T> = Omit<T, ExtractJsonApiReadOnlyKeys<T>>;

/**
 * Marker type for fields that can be set on POST (optional) but excluded from PATCH.
 * Use with @JsonApiImmutable() decorator for runtime behavior.
 *
 * Use case: fields that are computed by business logic for regular users,
 * but can be set by admins during creation. Cannot be modified after creation.
 *
 * @example
 * @Property()
 * @JsonApiImmutable()
 * public score!: number & JsonApiImmutableField;
 */
export type JsonApiImmutableField = { readonly __jsonApiImmutable?: never };

/**
 * Extracts keys of fields marked as JsonApiImmutableField
 */
export type ExtractJsonApiImmutableKeys<T> = {
  [K in keyof T]: T[K] extends JsonApiImmutableField ? K : never;
}[keyof T];