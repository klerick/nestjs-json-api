import { ModuleRef } from '@nestjs/core';
import {
  JsonApiTransformerService,
  OrmService,
  QueryOne,
} from '@klerick/json-api-nestjs';
import { ExtendAbility } from '../../../factories';
import {
  extractFieldsForCheck,
  handleAclQueryError,
  prepareAclQuery,
  getCurrentEntityAndParamMap,
  processItemFieldRestrictions,
  validateNoCurrentInRules,
} from '../../../utils';

export function getOneProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function getOneBind(
    this: OrmService<E, IdKey>,
    id: Parameters<OrmService<E, IdKey>['getOne']>[0],
    query: Parameters<OrmService<E, IdKey>['getOne']>[1]
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });

    const aclPrepared = prepareAclQuery<E, IdKey, QueryOne<E, IdKey>>(
      extendAbility,
      query
    );

    if (!aclPrepared) {
      return this.getOne(id, query);
    }

    validateNoCurrentInRules(extendAbility, 'getOneProxy');

    const { transformToJsonApi, aclQueryData, mergedQuery } = aclPrepared;

    // Fetch entity with ACL conditions - handle errors from invalid ACL rules
    let result: Awaited<ReturnType<OrmService<E, IdKey>['getOne']>>;

    try {
      result = await this.getOne(
        id,
        mergedQuery,
        transformToJsonApi,
        aclQueryData?.rulesForQuery
      );
    } catch (error) {
      throw handleAclQueryError(error, extendAbility.subject, 'getOneProxy');
    }

    // If already transformed by ORM, return as is
    if (transformToJsonApi) {
      return result;
    }

    const resultItem = result as E;

    const fieldsForCheck = extractFieldsForCheck<E, IdKey, QueryOne<E, IdKey>>(
      moduleRef,
      resultItem,
      query,
      aclQueryData
    );

    const { entityParamMap } = getCurrentEntityAndParamMap(moduleRef);

    const fieldRestrictions: Array<{ id: IdKey; fields: string[] }> = [];

    const restrictedFields = processItemFieldRestrictions<E, IdKey, QueryOne<E, IdKey>>(
      resultItem,
      fieldsForCheck,
      extendAbility,
      query,
      aclQueryData
    );

    if (restrictedFields.length > 0) {
      fieldRestrictions.push({
        [entityParamMap.primaryColumnName]: Reflect.get(
          resultItem,
          entityParamMap.primaryColumnName
        ) as IdKey,
        fields: restrictedFields,
      });
    }

    const jsonApiTransformerService = moduleRef.get<
      JsonApiTransformerService<E, IdKey>
    >(JsonApiTransformerService);

    const { data, included } = jsonApiTransformerService.transformData(
      resultItem,
      query
    );

    return {
      meta: {
        ...(fieldRestrictions.length > 0 && { fieldRestrictions }),
      },
      data,
      ...(included ? { included } : {}),
    };
  }
}
