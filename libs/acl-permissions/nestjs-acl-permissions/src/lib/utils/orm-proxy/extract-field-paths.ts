import {
  AnyEntity,
  EntityClass,
  QueryField,
} from '@klerick/json-api-nestjs-shared';
import {
  EntityParam,
  EntityParamMap,
  CURRENT_ENTITY,
  ENTITY_PARAM_MAP,
  QueryOne,
  Query,
} from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';
import { removeAclAddedFields } from './remove-acl-added-fields';
import { handleAclQueryError } from './handle-acl-query-error';

/**
 * Singleton class for extracting field paths from entity objects
 *
 * Features:
 * - Skips primary keys (they are always accessible, no ACL check needed)
 * - Recursively processes relationships
 * - Returns flat array of dot-notation paths
 * - Handles one-to-many (arrays) and one-to-one (objects) relationships
 *
 * @example
 * const extractor = ExtractFieldPaths.getInstance(entityParamMap);
 * const obj = {
 *   id: 1,  // primary key - will be skipped
 *   login: 'user',
 *   profile: { id: 10, phone: '123' }  // profile.id also skipped
 * };
 *
 * const paths = extractor.fields(obj, User);
 * // Returns: ['login', 'profile.phone']
 */
export class ExtractFieldPaths {
  private constructor(
    private entityParamMap: EntityParamMap<EntityClass<AnyEntity>>
  ) {}

  private extractField<E extends object>(
    obj: E,
    nameEntity: EntityClass<E>,
    prefix = ''
  ): string[] {
    const fields: string[] = [];
    const entityParam = this.entityParamMap.get(nameEntity) as
      | EntityParam<E>
      | undefined;
    if (!entityParam) {
      throw new Error(`Entity ${nameEntity.name} not found in EntityParamMap`);
    }

    // Add all properties (fields)
    for (const prop of entityParam.props as (keyof E)[]) {
      if (!(prop in obj) || entityParam.primaryColumnName === prop) {
        continue;
      }

      const path = (prefix ? `${prefix}.${prop.toString()}` : prop).toString();
      fields.push(path);
    }

    for (const relation of entityParam.relations as (keyof EntityParam<E>['relationProperty'])[]) {
      const value = obj[relation];
      const path = (
        prefix ? `${prefix}.${relation.toString()}` : relation
      ).toString();

      if (value === null || value === undefined) {
        continue;
      }

      // Get relation metadata
      const relationMeta = entityParam.relationProperty[relation];
      if (!relationMeta || !('entityClass' in relationMeta)) {
        continue;
      }

      // Handle arrays (one-to-many)
      if (Array.isArray(value)) {
        if (
          value.length > 0 &&
          typeof value[0] === 'object' &&
          value[0] !== null
        ) {
          const relObject = value[0];
          fields.push(
            ...this.extractField(relObject, relationMeta.entityClass, path)
          );
        }
        continue;
      }

      // Handle single object (one-to-one, many-to-one)
      if (typeof value === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fields.push(
          ...this.extractField(value as any, relationMeta.entityClass, path)
        );
      }
    }

    return fields;
  }

  fields<E extends object>(obj: E, entityClass: EntityClass<E>): string[] {
    return this.extractField(obj, entityClass);
  }

  /**
   * Extracts only props (entity fields) from object, excluding relationships and primary key
   * Skips primary key (same as fields() method)
   *
   * Use case: Create merged entity with only base fields for ACL checks
   *
   * @param obj - Source entity object (may contain loaded relationships)
   * @param entityClass - Entity class
   * @returns New object with only entity props (no relationships, no primary key)
   *
   * @example
   * const entity = { id: 1, login: 'user', role: 'admin', profile: { phone: '123' } };
   * const propsOnly = extractor.props(entity, User);
   * // Returns: { login: 'user', role: 'admin' }
   * // Note: id (primary key) and profile (relationship) excluded
   */
  props<E extends object>(obj: E, entityClass: EntityClass<E>): Partial<E> {
    const entityParam = this.entityParamMap.get(entityClass) as
      | EntityParam<E>
      | undefined;

    if (!entityParam) {
      throw new Error(`Entity ${entityClass.name} not found in EntityParamMap`);
    }

    const propsOnly: Partial<E> = {};

    // Copy all props (excluding primary key)
    for (const prop of entityParam.props as (keyof E)[]) {
      // Skip if prop not in object OR prop is primary key
      if (!(prop in obj) || entityParam.primaryColumnName === prop) {
        continue;
      }

      propsOnly[prop] = obj[prop];
    }

    return propsOnly;
  }

  private static instance: ExtractFieldPaths | undefined;
  static getInstance(
    entityParamMap: EntityParamMap<EntityClass<AnyEntity>>
  ): ExtractFieldPaths {
    if (!ExtractFieldPaths.instance) {
      ExtractFieldPaths.instance = new ExtractFieldPaths(entityParamMap);
    }
    return ExtractFieldPaths.instance;
  }
}

export function getCurrentEntityAndParamMap<E extends object>(moduleRef: ModuleRef) {
  const currentEntity = moduleRef.get<EntityClass<E>>(CURRENT_ENTITY);
  const entityParamMapService = moduleRef.get<
    EntityParamMap<EntityClass<AnyEntity>>
  >(ENTITY_PARAM_MAP, {
    strict: false,
  });
  const entityParamMap = entityParamMapService.get(currentEntity);

  if (!entityParamMap) {
    throw handleAclQueryError(
      new Error(`EntityParamMap not found for ${currentEntity.name}`),
      currentEntity.name,
      'extractFieldsForCheck'
    );
  }

  return { currentEntity, entityParamMap, entityParamMapService } as const;
}

/**
 * Extracts field paths for ACL checking
 *
 * This function:
 * 1. Gets entity metadata from moduleRef
 * 2. Clones the sample item
 * 3. Removes ACL-added fields that weren't requested by user
 * 4. Extracts field paths for checking
 *
 * @param moduleRef - NestJS module reference
 * @param sampleItem - Sample entity item (first item for getAll, result for getOne)
 * @param userQuery - Original user query
 * @param aclQueryData - ACL query data (fields and include that were added by ACL)
 * @returns Array of field paths to check
 */
export function extractFieldsForCheck<
  E extends object,
  IdKey extends string,
  Q extends QueryOne<E, IdKey> | Query<E, IdKey>
>(
  moduleRef: ModuleRef,
  sampleItem: E,
  userQuery: Q,
  aclQueryData?: {
    fields?: Q[QueryField.fields];
    include?: Q[QueryField.include];
    rulesForQuery?: Record<string, unknown>;
  }
): string[] {
  const { currentEntity, entityParamMapService } = getCurrentEntityAndParamMap(moduleRef);
  const copyItemForGetFieldCheck = structuredClone(sampleItem);

  if (aclQueryData) {
    removeAclAddedFields<E, IdKey, Q>(
      copyItemForGetFieldCheck,
      userQuery['fields'],
      aclQueryData.fields,
      userQuery['include'],
      aclQueryData.include
    );
  }

  return ExtractFieldPaths.getInstance(entityParamMapService).fields(
    copyItemForGetFieldCheck,
    currentEntity
  );
}
