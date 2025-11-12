import { OrmService, QueryOne } from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { ExtendAbility } from '../../../factories';
import {
  handleAclQueryError,
  prepareAclQuery,
  validateNoCurrentInRules,
} from '../../../utils';
import { subject } from '@casl/ability';
import { ForbiddenException, Logger } from '@nestjs/common';

export function getRelationshipProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function getOneBind<Rel extends RelationKeys<E, IdKey>>(
    this: OrmService<E, IdKey>,
    id: IdKey,
    rel: Rel
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });

    const aclPrepared = prepareAclQuery<E, IdKey, QueryOne<E, IdKey>>(
      extendAbility,
      {
        include: [rel as any],
        fields: null,
      },
      false
    );
    if (!aclPrepared) {
      return this.getRelationship(id, rel);
    }

    validateNoCurrentInRules(extendAbility, 'getRelationshipProxy');

    const { mergedQuery } = aclPrepared;

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
      throw handleAclQueryError(
        error,
        extendAbility.subject,
        'getRelationshipProxy'
      );
    }

    const resultItem = result as E;
    extendAbility.updateWithInput(resultItem);
    if (
      !extendAbility.can(
        extendAbility.action,
        subject(extendAbility.subject, resultItem),
        rel.toString()
      )
    ) {
      Logger.debug(
        `Access denied for (action: ${extendAbility.action}, subject: ${extendAbility.subject}), field ${rel.toString()}`,
        'getRelationshipProxy',
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

    return this.getRelationship(id, rel);
  };
}
