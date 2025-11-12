import { subject as subjectAbility } from '@casl/ability';
import { ExtendAbility } from '../../factories';
import { unsetDeep } from './unset-deep';
import { removeAclAddedFields } from './remove-acl-added-fields';
import { QueryField } from '@klerick/json-api-nestjs-shared';
import { Query, QueryOne } from '@klerick/json-api-nestjs';

/**
 * Processes field restrictions for a single item
 *
 * This function:
 * 1. Updates ability with item data for @input templates
 * 2. Checks each field against ACL rules
 * 3. Removes restricted fields from the item
 * 4. Removes ACL-added fields that weren't requested by user
 *
 * @param item - Entity item to process (mutated in place)
 * @param fieldsForCheck - Array of field paths to check
 * @param extendAbility - ExtendAbility instance for permission checking
 * @param query - Original user query
 * @param aclQueryData - ACL query data (fields and include added by ACL)
 * @returns Array of restricted field names
 */
export function processItemFieldRestrictions<
  E extends object,
  IdKey extends string,
  Q extends QueryOne<E, IdKey> | Query<E, IdKey>
>(
  item: E,
  fieldsForCheck: string[],
  extendAbility: ExtendAbility,
  query: Q,
  aclQueryData?: {
    fields?: Q[QueryField.fields];
    include?: Q[QueryField.include];
    rulesForQuery?: Record<string, unknown>;
  }
): string[] {
  // Update ability with item data for @input templates
  extendAbility.updateWithInput(item);

  const currentAction = extendAbility.action;
  const restrictedFieldsForItem: string[] = [];

  // Check each field
  for (const field of fieldsForCheck) {
    if (
      !extendAbility.can(
        currentAction,
        subjectAbility(extendAbility.subject, item),
        field
      )
    ) {
      // Remove field from item
      unsetDeep(item, field);
      restrictedFieldsForItem.push(field);
    }
  }

  // Remove ACL-added fields and relations that were not requested by user
  if (aclQueryData) {
    removeAclAddedFields<E, IdKey, Q>(
      item,
      query['fields'],
      aclQueryData.fields,
      query['include'],
      aclQueryData.include
    );
  }

  return restrictedFieldsForItem;
}