import { OrmService, PatchData, PatchRelationshipData, QueryOne } from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { ExtendAbility } from '../../../factories';
import { handleAclQueryError, prepareAclQuery } from '../../../utils';
import { subject } from '@casl/ability';
import { ForbiddenException, Logger } from '@nestjs/common';

export function patchRelationshipProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function patchRelationshipBind<Rel extends RelationKeys<E, IdKey>>(
    this: OrmService<E, IdKey>,
    id: IdKey,
    rel: Rel,
    input: PatchRelationshipData
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
      return this.patchRelationship(id, rel, input);
    }

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
        'patchRelationshipProxy'
      );
    }

    const oldResult = result as E;

    // Transform input to relationships format for loadRelations
    const relationshipsData = {
      [rel]: input,
    } as PatchData<E, IdKey>['relationships'];

    let loadedRelations: Partial<Record<string, any>>;

    try {
      loadedRelations = await this.loadRelations(relationshipsData);
    } catch (error) {
      throw handleAclQueryError(
        error,
        extendAbility.subject,
        'patchRelationshipProxy'
      );
    }

    // Entity for check contains:
    // - Root level: old entity + NEW relationships (replacing old ones)
    // - __current: old entity with OLD relationships (as loaded from DB)
    const entityToCheck = {
      ...oldResult,
      [rel]: loadedRelations[rel.toString()],  // NEW relationships (overwrite old)
      __current: oldResult,         // OLD entity with OLD relationships
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
        'patchRelationshipProxy',
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

    return this.patchRelationship(id, rel, input);
  };
}
