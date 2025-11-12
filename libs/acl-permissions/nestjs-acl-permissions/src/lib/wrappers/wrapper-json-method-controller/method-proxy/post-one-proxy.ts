import { ModuleRef } from '@nestjs/core';
import { OrmService } from '@klerick/json-api-nestjs';
import { ExtendAbility } from '../../../factories';
import { handleAclQueryError, validateNoCurrentInRules } from '../../../utils';
import { subject } from '@casl/ability';
import { ForbiddenException, Logger } from '@nestjs/common';

export function postOneProxy<E extends object, IdKey extends string>(
  moduleRef: ModuleRef
) {
  return async function postOneBind(
    this: OrmService<E, IdKey>,
    inputData: Parameters<OrmService<E, IdKey>['postOne']>[0]
  ) {
    const extendAbility = moduleRef.get(ExtendAbility, { strict: false });
    if (
      !extendAbility ||
      extendAbility.rules.length === 0 ||
      (!extendAbility.hasConditions && !extendAbility.hasFields)
    ) {
      return this.postOne(inputData);
    }

    validateNoCurrentInRules(extendAbility, 'postOneProxy');

    const { relationships, attributes } = inputData;

    let loadedRelations: Partial<Record<string, any>> = {};

    if (relationships) {
      try {
        loadedRelations = await this.loadRelations(relationships);
      } catch (error) {
        throw handleAclQueryError(
          error,
          extendAbility.subject,
          'postOneProxy'
        );
      }
    }

    const resultEntity = {
      ...(attributes || {}),
      ...loadedRelations,
    } as E;

    const changedAttributes: string[] = [
      ...Object.keys(attributes || {}),
      ...Object.keys(loadedRelations),
    ];

    extendAbility.updateWithInput(resultEntity);

    if (
      !extendAbility.can(
        extendAbility.action,
        subject(extendAbility.subject, resultEntity)
      )
    ) {
      Logger.debug(
        `Access denied for (action: ${extendAbility.action}, subject: ${extendAbility.subject})`,
        'postOneProxy',
        {
          subject: resultEntity,
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

    for (const field of changedAttributes) {
      if (
        !extendAbility.can(
          extendAbility.action,
          subject(extendAbility.subject, resultEntity),
          field
        )
      ) {
        Logger.debug(
          `Field-level access denied for field '${field}'`,
          'postOneProxy',
          {
            field,
            value: (resultEntity as Record<string, unknown>)[field],
            subject: resultEntity,
            rules: extendAbility.rules,
          }
        );

        throw new ForbiddenException(
          [
            {
              code: 'forbidden',
              message: `not allow to set field "${field}"`,
              path: ['data', 'attributes', field],
            },
          ],
          {
            description: `Field-level access denied for ${field}`,
          }
        );
      }
    }
    return this.postOne(inputData);
  };
}
