import { ExtendAbility } from '../../factories';
import { handleAclQueryError } from './handle-acl-query-error';

/**
 * Validates that ACL rules don't contain __current field references
 *
 * The __current field is only supported in operations that compare old vs new values:
 * - patchOne
 * - patchRelationship
 *
 * Other operations (getAll, getOne, postOne, deleteOne, etc.) should not use __current
 * as there is no "old value" to compare against.
 *
 * Uses fast string search to check for __current references in rule conditions.
 * Throws on first found __current reference (fail-fast approach)
 *
 * @param ability - ExtendAbility instance to validate
 * @param context - Context name for error message (e.g., 'getOneProxy', 'postOneProxy')
 * @throws Error if __current is found in rules
 */
export function validateNoCurrentInRules(
  ability: ExtendAbility,
  context: string
): void {
  // Fast check: convert to JSON and search for __current references
  const rulesJson = JSON.stringify(ability.rules);

  // Search for __current as field reference: "__current"
  if (rulesJson.includes('"__current')) {
    const error = new Error(
      `Field __current is not supported in ${ability.action} operation. ` +
        `__current is only available in patchOne and patchRelationship operations ` +
        `where old and new values need to be compared.`
    );
    throw handleAclQueryError(error, ability.subject, context);
  }
}