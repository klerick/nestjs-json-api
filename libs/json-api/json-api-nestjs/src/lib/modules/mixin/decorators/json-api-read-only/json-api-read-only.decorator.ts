import {
  JSON_API_DECORATOR_READ_ONLY,
  JSON_API_DECORATOR_IMMUTABLE,
} from '../../../../constants';

/**
 * Marks a field as read-only for JSON:API.
 * The field will be excluded from POST/PATCH validation.
 *
 * Use together with JsonApiReadOnly type for compile-time checking.
 *
 * Note: For FK fields (relationFkField), only the type marker is needed
 * since runtime exclusion is handled automatically.
 *
 * @example
 * // Computed/auto-generated field - decorator + type marker
 * @Property()
 * @JsonApiReadOnly()
 * public createdAt!: Date & JsonApiReadOnly;
 *
 * @example
 * // FK field - only type marker needed (no decorator required)
 * @Property({ persist: false })
 * public createdById!: number & Opt & JsonApiReadOnly;
 */
export function JsonApiReadOnly(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingKeys: (string | symbol)[] =
      Reflect.getMetadata(JSON_API_DECORATOR_READ_ONLY, target.constructor) || [];

    Reflect.defineMetadata(
      JSON_API_DECORATOR_READ_ONLY,
      [...existingKeys, propertyKey],
      target.constructor
    );
  };
}

type Constructor = new (...args: unknown[]) => object;

/**
 * Get list of read-only fields from entity class.
 * Collects metadata from entire prototype chain (handles inheritance).
 */
export function getJsonApiReadOnlyFields(target: Constructor): string[] {
  return collectFieldsFromPrototypeChain(target, JSON_API_DECORATOR_READ_ONLY);
}

/**
 * Marks a field as immutable for JSON:API.
 * The field will be optional in POST validation and excluded from PATCH validation.
 *
 * Use case: fields that are computed by business logic for regular users,
 * but can be set by admins during creation. Cannot be modified after creation.
 *
 * Use together with JsonApiImmutable type for compile-time checking.
 *
 * @example
 * @Property()
 * @JsonApiImmutable()
 * public score!: number & JsonApiImmutable;
 */
export function JsonApiImmutable(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingKeys: (string | symbol)[] =
      Reflect.getMetadata(JSON_API_DECORATOR_IMMUTABLE, target.constructor) || [];

    Reflect.defineMetadata(
      JSON_API_DECORATOR_IMMUTABLE,
      [...existingKeys, propertyKey],
      target.constructor
    );
  };
}

/**
 * Get list of immutable fields from entity class.
 * Collects metadata from entire prototype chain (handles inheritance).
 */
export function getJsonApiImmutableFields(target: Constructor): string[] {
  return collectFieldsFromPrototypeChain(target, JSON_API_DECORATOR_IMMUTABLE);
}

/**
 * Helper function to collect fields from prototype chain.
 */
function collectFieldsFromPrototypeChain(
  target: Constructor,
  metadataKey: symbol
): string[] {
  const allKeys = new Set<string>();

  let currentTarget: Constructor | null = target;
  while (currentTarget && currentTarget !== Object) {
    const keys: (string | symbol)[] =
      Reflect.getOwnMetadata(metadataKey, currentTarget) || [];

    for (const key of keys) {
      allKeys.add(key.toString());
    }

    currentTarget = Object.getPrototypeOf(currentTarget);
  }

  return Array.from(allKeys);
}