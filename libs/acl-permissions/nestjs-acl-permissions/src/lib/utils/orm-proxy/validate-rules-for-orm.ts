import { ExtendAbility } from '../../factories';
import { handleAclQueryError } from './handle-acl-query-error';

/**
 * Unsupported operators in MikroORM that exist in CASL
 */
const UNSUPPORTED_OPERATORS = ['$size', '$elemMatch', '$options', '$where'];

/**
 * Validates that ACL rules don't contain operators unsupported by MikroORM
 *
 * Uses fast string search to check for unsupported operators:
 * - $size: array size check
 * - $elemMatch: array element matching
 * - $options: regex options
 * - $where: JavaScript function execution
 *
 * Throws on first found unsupported operator (fail-fast approach)
 *
 * @param ability - ExtendAbility instance to validate
 * @throws Error if any unsupported operator is found
 */
export function validateRulesForORM(ability: ExtendAbility): void {
  // Fast check: convert to JSON and search for operator keys
  const rulesJson = JSON.stringify(ability.rules);

  for (const operator of UNSUPPORTED_OPERATORS) {
    // Search for operator as JSON key: "$operator"
    if (rulesJson.includes(`"${operator}"`)) {
      const error =  new Error(
        `Unsupported operator: ${operator}. ` +
        `Supported operators: $eq, $ne, $lt, $lte, $gt, $gte, $in, $nin, $and, $or, $not, $exists, $all, $regex, $nor. `
      );
      throw handleAclQueryError(error, ability.subject, 'validateRulesForMikroORM');
    }
  }
}
