import { ModuleRef } from '@nestjs/core';
import { OrmService, QueryOne } from '@klerick/json-api-nestjs';
import { ExtendAbility } from '../../../factories';
import {
  handleAclQueryError,
  prepareAclQuery,
  getCurrentEntityAndParamMap,
  ExtractFieldPaths,
} from '../../../utils';
import { subject } from '@casl/ability';
import { ForbiddenException, Logger } from '@nestjs/common';

export function patchOneProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function patchOneBind(
    this: OrmService<E, IdKey>,
    id: Parameters<OrmService<E, IdKey>['patchOne']>[0],
    inputData: Parameters<OrmService<E, IdKey>['patchOne']>[1]
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });
    const aclPrepared = prepareAclQuery<E, IdKey, QueryOne<E, IdKey>>(
      extendAbility,
      {
        include: [],
        fields: null,
      }
    );
    if (!aclPrepared) {
      return this.patchOne(id, inputData);
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
      throw handleAclQueryError(error, extendAbility.subject, 'patchOneProxy');
    }
    const resultItem = result as E;

    const { relationships, attributes } = inputData;

    const relationshipsToChange = Object.keys(relationships || {});

    let loadedRelations: Partial<Record<string, any>> = {};

    if (relationships) {
      try {
        loadedRelations = await this.loadRelations(relationships);
      } catch (error) {
        throw handleAclQueryError(
          error,
          extendAbility.subject,
          'patchOneProxy'
        );
      }
    }

    const { currentEntity: entityClass, entityParamMapService } =
      getCurrentEntityAndParamMap<E>(moduleRef);

    const extractor = ExtractFieldPaths.getInstance(entityParamMapService);
    const currentEntityPropsOnly = extractor.props(resultItem, entityClass);

    const mergedEntity = {
      ...currentEntityPropsOnly,
      ...(attributes || {}),
      ...loadedRelations,
    } as E;

    // Detect changed attributes by comparing old (DB) vs new (request) values
    // Coverage: ~90% of real-world use cases
    //
    // Comparison strategy:
    // - Primitives (string, number, boolean, null): strict equality (===)
    // - Objects/Arrays: JSON.stringify comparison
    //
    // Known edge cases (acceptable tradeoffs):
    // 1. JSONB fields with different key order may trigger false positives:
    //    { a: 1, b: 2 } !== { b: 2, a: 1 } (content identical, but detected as different)
    // 2. Circular references: Not expected in JSON API requests (would fail JSON.parse)
    // 3. Date objects: try to use toISOString() for comparison
    //
    // If you encounter issues, please create a GitHub issue with your use case.
    const changedAttributes: string[] = [];
    if (attributes) {
      for (const attrKey of Object.keys(attributes)) {
        let currentValue = (currentEntityPropsOnly as Record<string, unknown>)[
          attrKey
        ];
        let newValue = (attributes as Record<string, unknown>)[attrKey];
        newValue =
          newValue !== null && typeof newValue === 'object'
            ? newValue instanceof Date ? newValue.toISOString() : JSON.stringify(newValue)
            : newValue;
        currentValue =
          currentValue !== null && typeof currentValue === 'object'
            ? currentValue instanceof Date ? currentValue.toISOString() : JSON.stringify(currentValue)
            : currentValue;

        if (currentValue !== newValue) {
          changedAttributes.push(attrKey);
        }
      }
    }

    const changedFields = [...changedAttributes, ...relationshipsToChange];

    // Entity for check contains:
    // - Root level: NEW values (merged entity after applying changes)
    // - __current: OLD values (entity as loaded from DB)
    // This enables rules to compare old vs new values, e.g.:
    // - Allow removing only self: { '__current.coAuthorIds': { $in: [@input.userId] }, 'coAuthorIds': { $nin: [@input.userId] } }
    const entityForCheck = {
      ...mergedEntity,
      __current: resultItem,
    } as E;

    extendAbility.updateWithInput(entityForCheck);

    // Entity-level check
    if (
      !extendAbility.can(
        extendAbility.action,
        subject(extendAbility.subject, entityForCheck)
      )
    ) {
      Logger.debug(
        `Access denied for (action: ${extendAbility.action}, subject: ${extendAbility.subject})`,
        'patchOneProxy',
        {
          subject: entityForCheck,
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

    // Field-level checks for changed fields
    for (const field of changedFields) {
      if (
        !extendAbility.can(
          extendAbility.action,
          subject(extendAbility.subject, entityForCheck),
          field
        )
      ) {
        Logger.debug(
          `Field-level access denied for field '${field}'`,
          'patchOneProxy',
          {
            field,
            currentValue: (
              (entityForCheck as any).__current as Record<string, unknown>
            )[field],
            newValue: (entityForCheck as Record<string, unknown>)[field],
            subject: entityForCheck,
            rules: extendAbility.rules,
          }
        );

        throw new ForbiddenException(
          [
            {
              code: 'forbidden',
              message: `not allow to modify field "${field}"`,
              path: ['data', 'attributes', field],
            },
          ],
          {
            description: `Field-level access denied for ${field}`,
          }
        );
      }
    }

    return this.patchOne(id, inputData);
  };
}
