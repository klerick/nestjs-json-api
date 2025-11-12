import { OrmService, PostRelationshipData, QueryOne } from '@klerick/json-api-nestjs';
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

export function deleteRelationshipProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function deleteRelationshipBind<Rel extends RelationKeys<E, IdKey>>(
    this: OrmService<E, IdKey>,
    id: IdKey,
    rel: Rel,
    input: PostRelationshipData
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
      return this.deleteRelationship(id, rel, input);
    }

    validateNoCurrentInRules(extendAbility, 'deleteRelationshipProxy');

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
        'deleteRelationshipProxy'
      );
    }

    const resultItem = result as E;

    // Filter relationship to only items being deleted from input.data
    const idsToDelete = new Set(
      Array.isArray(input)
        ? input.map((item) => item.id)
        : [input.id]
    );

    // For to-many relationships, filter to only items being deleted
    // For to-one relationships, keep as is
    if (Array.isArray((resultItem as any)[rel])) {
      (resultItem as any)[rel] = (resultItem as any)[rel].filter((item: any) =>
        idsToDelete.has(item.id)
      );
    }

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
        'deleteRelationshipProxy',
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

    return this.deleteRelationship(id, rel, input);
  };
}
