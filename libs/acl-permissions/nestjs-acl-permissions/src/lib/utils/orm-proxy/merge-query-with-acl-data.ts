import { Query, QueryOne } from '@klerick/json-api-nestjs';
import { QueryField } from '@klerick/json-api-nestjs-shared';
/**
 * Merges user query with ACL fields and includes
 *
 * IMPORTANT: fields: null or missing relation key means "select ALL fields"
 * We should NOT add ACL fields in such cases to avoid turning "all fields" into "specific fields"
 *
 * @param query - Original user query
 * @param aclFields - ACL fields to add (fields structure with target and relations)
 * @param aclInclude - ACL includes to add
 * @returns Merged query
 *
 * @example
 * // Case 1: fields: null → select all, don't add ACL fields
 * mergeQueryWithAclData({ fields: null }, { target: ['role'] })
 * // → { fields: null } (unchanged)
 *
 * // Case 2: fields: { target: ['id'] } → add ACL fields to target
 * mergeQueryWithAclData({ fields: { target: ['id'] } }, { target: ['role'] })
 * // → { fields: { target: ['id', 'role'] } }
 *
 * // Case 3: fields: { target: ['id'] } + ACL needs profile → don't add profile fields
 * mergeQueryWithAclData({ fields: { target: ['id'] } }, { profile: ['isPublic'] })
 * // → { fields: { target: ['id'] } } (profile missing = all fields)
 */
export function mergeQueryWithAclData<
  E extends object,
  IdKey extends string,
  Q extends QueryOne<E, IdKey> | Query<E, IdKey>
>(
  query: Q,
  aclFields?: Q[QueryField.fields],
  aclInclude?: Q[QueryField.include]
): Q {
  // Start with merged query
  const mergedQuery = { ...query };

  // 1. Always merge includes (add ACL includes to user includes)
  if (
    aclInclude &&
    'length' in aclInclude &&
    parseInt(`${aclInclude.length}`) > 0
  ) {
    const userInclude = Array.isArray(query.include) ? query.include : [];
    const aclIncludeArray = Array.isArray(aclInclude) ? aclInclude : [];
    mergedQuery.include = Array.from(
      new Set([...userInclude, ...aclIncludeArray])
    ) as any;
  }

  // 2. Merge fields (complex logic for null/undefined handling)
  if (!aclFields) {
    return mergedQuery; // No ACL fields to merge
  }

  // CASE 1: fields === null → "select ALL fields everywhere"
  if (query.fields === null) {
    return mergedQuery; // Don't modify, null already includes all ACL fields
  }

  // CASE 2: fields === undefined → "select ALL fields everywhere"
  if (query.fields === undefined) {
    return mergedQuery; // Don't modify
  }

  // CASE 3: fields === {} (empty object) → "select ALL fields everywhere"
  if (Object.keys(query.fields).length === 0) {
    return mergedQuery; // Don't modify
  }

  // CASE 4: fields is object with keys → merge selectively
  mergedQuery.fields = { ...query.fields };

  for (const [relation, aclFieldsList] of Object.entries(aclFields)) {
    if (!Array.isArray(aclFieldsList)) {
      continue; // Skip invalid ACL fields
    }

    const userFieldsList = (query.fields as any)[relation];

    // Sub-case 1: relation key missing in user fields → "all fields for this relation"
    if (userFieldsList === undefined) {
      continue; // Don't add ACL fields, user wants all fields for this relation
    }

    // Sub-case 2: relation: null → "all fields for this relation"
    if (userFieldsList === null) {
      continue; // Don't add ACL fields
    }

    // Sub-case 3: relation is array → merge with ACL fields
    if (Array.isArray(userFieldsList)) {
      const merged = [...new Set([...userFieldsList, ...aclFieldsList])];
      (mergedQuery.fields as any)[relation] = merged;
    }
  }

  return mergedQuery;
}
