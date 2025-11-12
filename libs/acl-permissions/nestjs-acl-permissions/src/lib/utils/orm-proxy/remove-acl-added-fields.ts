import { Query, QueryOne } from '@klerick/json-api-nestjs';
import { QueryField } from '@klerick/json-api-nestjs-shared';
import { unsetDeep } from './unset-deep';

/**
 * Removes ACL-added fields and relations from item that were not requested by user
 *
 * IMPORTANT: Must match the logic of mergeQueryWithAclData!
 * Only removes fields/relations that were ACTUALLY ADDED by mergeQueryWithAclData.
 *
 * mergeQueryWithAclData adds ACL fields ONLY when userFields[relation] is an array.
 * It does NOT add when: null, undefined, {}, missing key, or relation: null.
 *
 * @param item - Entity item to clean
 * @param userFields - Fields requested by user (query.fields)
 * @param aclFields - Fields added by ACL (aclQueryData.fields)
 * @param userInclude - Relations requested by user (query.include)
 * @param aclInclude - Relations added by ACL (aclQueryData.include)
 *
 * @example
 * // Case 1: userFields: null → ACL didn't add fields, don't remove
 * removeAclAddedFields(item, null, { target: ['role'] })
 * // → nothing removed (null = all fields requested)
 *
 * // Case 2: userFields: { target: ['id'] } → ACL added 'role', remove it
 * removeAclAddedFields(item, { target: ['id'] }, { target: ['role'] })
 * // → removes 'role' from item
 *
 * // Case 3: ACL added include → remove entire relation
 * removeAclAddedFields(item, null, null, [], ['profile'])
 * // → removes profile relation (not requested by user)
 */
export function removeAclAddedFields<
  E extends object,
  IdKey extends string,
  Q extends QueryOne<E, IdKey> | Query<E, IdKey>
>(
  item: E,
  userFields?: Q[QueryField.fields],
  aclFields?: Q[QueryField.fields],
  userInclude?: Q[QueryField.include],
  aclInclude?: Q[QueryField.include]
): void {
  // Remove relations added by ACL include (independent of fields logic)
  if (
    aclInclude &&
    'length' in aclInclude &&
    parseInt(`${aclInclude.length}`) > 0
  ) {
    const userIncludeArray = (Array.isArray(userInclude) ? userInclude : []) as string[];
    const aclIncludeArray = (Array.isArray(aclInclude) ? aclInclude : []) as string[];
    for (const relation of aclIncludeArray) {
      // If relation was added by ACL (not in user include), remove it
      if (!userIncludeArray.includes(relation)) {
        delete (item as any)[relation];
      }
    }
  }

  if (!aclFields) {
    return;
  }

  // CASE 1: userFields === null → all fields requested, ACL didn't add field-level data
  if (userFields === null) {
    return; // Don't remove fields (but relations already removed above)
  }

  // CASE 2: userFields === undefined → all fields requested
  if (userFields === undefined) {
    return; // Don't remove fields
  }

  // CASE 3: userFields === {} → all fields requested
  if (typeof userFields === 'object' && Object.keys(userFields).length === 0) {
    return; // Don't remove fields
  }

  // CASE 4: userFields is object with keys
  for (const [relation, aclFieldsArray] of Object.entries(aclFields)) {
    if (!Array.isArray(aclFieldsArray)) continue;

    const userFieldsArray = (userFields as any)[relation];

    // Sub-case 1: relation key missing → all fields for this relation requested
    if (userFieldsArray === undefined) {
      continue; // ACL didn't add fields, don't remove
    }

    // Sub-case 2: relation: null → all fields for this relation requested
    if (userFieldsArray === null) {
      continue; // ACL didn't add fields, don't remove
    }

    // Sub-case 3: relation is array → ACL MAY have added fields, check and remove
    if (Array.isArray(userFieldsArray)) {
      for (const field of aclFieldsArray) {
        if (!userFieldsArray.includes(field)) {
          // This field was added by ACL - remove it
          if (relation === 'target') {
            unsetDeep(item, field);
          } else {
            // Check if relation is an array (one-to-many)
            const relationValue = (item as any)[relation];
            if (Array.isArray(relationValue)) {
              // Remove field from each element in the array
              for (const element of relationValue) {
                if (typeof element === 'object' && element !== null) {
                  unsetDeep(element, field);
                }
              }
            } else {
              // Single object (one-to-one) - remove nested field
              unsetDeep(item, `${relation}.${field}`);
            }
          }
        }
      }
    }
  }
}
