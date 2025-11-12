import { ExtendAbility } from '../../factories';
import { mergeQueryWithAclData } from './merge-query-with-acl-data';
import { validateRulesForORM } from './validate-rules-for-orm';
import { Query, QueryOne } from '@klerick/json-api-nestjs';

export function prepareAclQuery<E extends object, IdKey extends string, Q  extends QueryOne<E, IdKey> | Query<E, IdKey>>(
  extendAbility: ExtendAbility,
  query: Q,
  needValidateRules = true
) {
  // Fast path: no rules or no restrictions
  if (
    !extendAbility ||
    extendAbility.rules.length === 0 ||
    (!extendAbility.hasConditions && !extendAbility.hasFields)
  ) {
    return null;
  }

  // Determine strategy
  const hasConditions = extendAbility.hasConditions;
  const hasFields = extendAbility.hasFields;
  const transformToJsonApi = hasConditions && !hasFields;

  // Validate rules for ORM compatibility if there are conditions
  if (needValidateRules && hasConditions) {
    validateRulesForORM(extendAbility);
  }

  // Fetch with ACL query
  const aclQueryData = hasConditions
    ? extendAbility.getQueryObject<E, IdKey, Q>()
    : undefined;

  // Merge ACL query with user query
  const mergedQuery = aclQueryData
    ? mergeQueryWithAclData<E, IdKey, Q>(
        query,
        aclQueryData.fields,
        aclQueryData.include
      )
    : query;

  return {
    transformToJsonApi,
    aclQueryData,
    mergedQuery,
  };
}
