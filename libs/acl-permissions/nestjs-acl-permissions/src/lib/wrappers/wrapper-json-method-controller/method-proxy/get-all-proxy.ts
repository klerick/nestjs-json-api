import {
  JsonApiTransformerService,
  OrmService,
  Query,
} from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';
import { ExtendAbility } from '../../../factories';
import {
  extractFieldsForCheck,
  handleAclQueryError,
  prepareAclQuery,
  getCurrentEntityAndParamMap,
  processItemFieldRestrictions,
  validateNoCurrentInRules,
} from '../../../utils';

export function getAllProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function getAllBind(
    this: OrmService<E, IdKey>,
    query: Parameters<OrmService<E, IdKey>['getAll']>[0]
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });

    const aclPrepared = prepareAclQuery<E, IdKey, Query<E, IdKey>>(
      extendAbility,
      query
    );

    if (!aclPrepared) {
      return this.getAll(query);
    }

    validateNoCurrentInRules(extendAbility, 'getAllProxy');

    const { transformToJsonApi, aclQueryData, mergedQuery } = aclPrepared;


    // Fetch entity with ACL conditions - handle errors from invalid ACL rules
    let result: Awaited<ReturnType<OrmService<E, IdKey>['getAll']>>;
    try {
      result = await this.getAll(
        mergedQuery,
        transformToJsonApi,
        aclQueryData?.rulesForQuery
      );
    } catch (error) {
      throw handleAclQueryError(error, extendAbility.subject, 'getAllProxy');
    }

    // If already transformed by ORM, return as is
    if (transformToJsonApi) {
      return result;
    }

    // Manual transformation with field filtering
    const { totalItems, items } = result as { totalItems: number; items: E[] };
    const { page } = query;

    // Build meta
    const meta = {
      totalItems,
      pageNumber: page.number,
      pageSize: page.size,
    };

    // If empty, return immediately
    if (totalItems === 0 || items.length === 0) {
      return { meta, data: [] };
    }

    const fieldsForCheck = extractFieldsForCheck<E, IdKey, Query<E, IdKey>>(
      moduleRef,
      items[0],
      query,
      aclQueryData
    );

    const { entityParamMap } = getCurrentEntityAndParamMap(moduleRef);

    // Field filtering logic
    const fieldRestrictions: Array<{ id: IdKey; fields: string[] }> = [];

    for (const item of items) {
      const restrictedFields = processItemFieldRestrictions<E, IdKey, Query<E, IdKey>>(
        item,
        fieldsForCheck,
        extendAbility,
        query,
        aclQueryData
      );

      if (restrictedFields.length > 0) {
        fieldRestrictions.push({
          [entityParamMap.primaryColumnName]: Reflect.get(
            item,
            entityParamMap.primaryColumnName
          ) as IdKey,
          fields: restrictedFields,
        });
      }
    }

    // Transform data using JsonApiTransformerService
    const jsonApiTransformerService = moduleRef.get<
      JsonApiTransformerService<E, IdKey>
    >(JsonApiTransformerService);

    const { data, included } = jsonApiTransformerService.transformData(
      items,
      query
    );

    return {
      meta: {
        ...meta,
        ...(fieldRestrictions.length > 0 && { fieldRestrictions }),
      },
      data,
      ...(included ? { included } : {}),
    };
  };
}
