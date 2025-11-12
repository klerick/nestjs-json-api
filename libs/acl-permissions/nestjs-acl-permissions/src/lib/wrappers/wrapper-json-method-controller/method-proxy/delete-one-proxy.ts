import { ModuleRef } from '@nestjs/core';
import { OrmService, QueryOne } from '@klerick/json-api-nestjs';
import { ExtendAbility } from '../../../factories';
import {
  handleAclQueryError,
  prepareAclQuery,
  validateNoCurrentInRules,
} from '../../../utils';
import { ForbiddenException, Logger } from '@nestjs/common';
import { subject } from '@casl/ability';

export function deleteOneProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function deleteOneBind(
    this: OrmService<E, IdKey>,
    id: Parameters<OrmService<E, IdKey>['deleteOne']>[0]
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });

    const aclPrepared = prepareAclQuery<E, IdKey, QueryOne<E, IdKey>>(
      extendAbility,
      {
        include: [],
        fields: null,
      },
       false
    );
    if (!aclPrepared) {
      return this.deleteOne(id);
    }

    validateNoCurrentInRules(extendAbility, 'deleteOneProxy');

    const {
      mergedQuery,
    } = aclPrepared;

    // Fetch entity with ACL conditions - handle errors from invalid ACL rules
    let result: Awaited<ReturnType<OrmService<E, IdKey>['getOne']>>;

    try {
      result = await this.getOne(
        id,
        {
          fields: null,
          include: mergedQuery.include,
        },
        false,
        undefined
      );
    } catch (error) {
      throw handleAclQueryError(error, extendAbility.subject, 'deleteOneProxy');
    }

    const resultItem = result as E;
    extendAbility.updateWithInput(resultItem);
    if (
      !extendAbility.can(
        extendAbility.action,
        subject(extendAbility.subject, resultItem)
      )
    ) {
      Logger.debug(
        `Access denied for (action: ${extendAbility.action}, subject: ${extendAbility.subject})`,
        'deleteOneProxy',
        {
          subject: resultItem,
          rules: extendAbility.rules,
        }
      );
      throw new ForbiddenException(
        [
          {
            code: 'forbidden',
            message: `not allow "${extendAbility.action}"`,
            path: ['action'],
          },
        ],
        {
          description: `Access denied for ${extendAbility.action} on ${extendAbility.subject}`,
        }
      );
    }

    return this.deleteOne(id);
  };
}
