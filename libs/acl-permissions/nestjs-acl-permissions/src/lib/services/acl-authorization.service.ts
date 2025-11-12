import { Injectable, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ACL_MODULE_OPTIONS, ACL_CONTEXT_KEY } from '../constants';
import {
  AclControllerMetadata,
  AclControllerMethodsOptions,
  AclModuleOptions,
  AclRule,
  AclRulesLoader,
  type AclSubject,
} from '../types';
import { getActionOptions } from '../utils';
import { ABILITY_FACTORY, AbilityFactory } from '../factories';


@Injectable()
export class AclAuthorizationService {
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(ACL_MODULE_OPTIONS) private readonly options!: AclModuleOptions;
  @Inject(ABILITY_FACTORY) private readonly abilityFactory!: AbilityFactory;

  private readonly logger = new Logger(AclAuthorizationService.name);

  async authorize(
    controllerName: string,
    action: string,
    metaData: AclControllerMetadata
  ): Promise<boolean> {
    const { subject: subjectForRules } = metaData;

    const actionOptions = getActionOptions(
      this.options,
      metaData.methods[action]
    );
    const subject = this.getSubjectFromInput(subjectForRules);

    const rulesLoader = this.moduleRef.get<AclRulesLoader>(
      this.options.rulesLoader,
      { strict: false }
    );

    const [rules, context, helpers] = await Promise.all([
      rulesLoader.loadRules(subjectForRules, action),
      rulesLoader.getContext(),
      rulesLoader.getHelpers(),
    ]);

    const resultRules =
      Array.isArray(rules) && rules.length > 0
        ? rules
        : this.getDefaultRulesForAction(
            controllerName,
            action,
            subject,
            actionOptions
          );

    const ability = this.abilityFactory(subject, action, resultRules, context, helpers);
    if (!ability.can(action, subject)) {
      this.logger.debug(
        `Access denied for ${controllerName}.${action} (action: ${action}, subject: ${subject})`
      );
      throw new ForbiddenException(
        [
          {
            code: 'forbidden',
            message: `not allow "${action}"`,
            path: ['action'],
          },
        ],
        {
          description: `Access denied for ${action} on ${subject}`,
        }
      );
    }

    const contextStore = this.moduleRef.get(this.options.contextStore, {
      strict: false,
    });

    contextStore.set(ACL_CONTEXT_KEY, ability);

    return true;
  }

  private getDefaultRulesForAction(
    controllerName: string,
    action: string,
    subject: AclSubject,
    actionOptions: Exclude<AclControllerMethodsOptions, boolean>
  ): AclRule[] {
    if (actionOptions.defaultRules && actionOptions.defaultRules.length > 0) {
      this.logger.debug(
        `No rules for ${controllerName}.${action}, applying defaultRules`
      );
      return actionOptions.defaultRules;
    }

    const policy = actionOptions.onNoRules || 'deny';

    if (policy === 'deny') {
      this.logger.error(
        `No ACL rules defined for ${controllerName}.${action}, denying access (onNoRules: '${policy}')`
      );
      throw new ForbiddenException(
        [
          {
            code: 'forbidden',
            message: `not allow access`,
            path: [],
          },
        ],
        {
          description: `No ACL rules defined for ${controllerName}.${action}`,
        }
      );
    }

    this.logger.warn(
      `No ACL rules defined for ${controllerName}.${action}, allowing access with permissive rule (onNoRules: '${policy}')`
    );
    return [
      {
        action,
        subject,
      },
    ];
  }

  private getSubjectFromInput(subject: AclSubject): string {
    if (typeof subject === 'string') {
      return subject;
    }
    if (typeof subject === 'function' && subject.name) {
      return subject.name;
    }

    throw new Error('Entity shouldbe class or string');
  }
}
