import { OrmService, PostData, PostRelationshipData, QueryOne } from '@klerick/json-api-nestjs';
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

export function postRelationshipProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function postRelationshipBind<Rel extends RelationKeys<E, IdKey>>(
    this: OrmService<E, IdKey>,
    id: IdKey,
    rel: Rel,
    input: PostRelationshipData
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
      return this.postRelationship(id, rel, input);
    }

    validateNoCurrentInRules(extendAbility, 'postRelationshipProxy');

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
        'postRelationshipProxy'
      );
    }

    const resultItem = result as E;

    // Transform input to relationships format for loadRelations
    const relationshipsData = {
      [rel]: input,
    } as PostData<E, IdKey>['relationships'];

    let loadedRelations: Partial<Record<string, any>>;

    try {
      loadedRelations = await this.loadRelations(relationshipsData);
    } catch (error) {
      throw handleAclQueryError(
        error,
        extendAbility.subject,
        'postRelationshipProxy'
      );
    }

    // Merge entity with relations being added
    const entityToCheck = {
      ...resultItem,
      ...loadedRelations,
    } as E;

    extendAbility.updateWithInput(entityToCheck);
    if (
      !extendAbility.can(
        extendAbility.action,
        subject(extendAbility.subject, entityToCheck),
        rel.toString()
      )
    ) {
      Logger.debug(
        `Access denied for (action: ${extendAbility.action}, subject: ${extendAbility.subject}), field ${rel.toString()}`,
        'postRelationshipProxy',
        {
          subject: entityToCheck,
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

    return this.postRelationship(id, rel, input);
  };
}