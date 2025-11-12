import type { Type } from '@nestjs/common';
import { AclRule, AclRulesLoader } from './acl-rules.types';
import { AclContextStore } from './acl-context.types';

/**
 * Policy for handling resources with no ACL rules defined
 */
export type OnNoRulesPolicy = 'deny' | 'allow';

/**
 * Options for configuring ACL module
 */
export interface AclModuleOptions {
  /**
   * Service class that loads ACL rules from external source
   * Must implement AclRulesLoader interface
   * Will be retrieved via moduleRef to support services from other modules
   */
  rulesLoader: Type<AclRulesLoader>;

  /**
   * Context store for passing ACL data through request pipeline
   * Required to access ExtendableAbility in pipes/guards/services via CLS
   * Can be ClsService from nestjs-cls or any service with set/get methods
   *
   * @example
   * ```typescript
   * import { ClsService } from 'nestjs-cls';
   *
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   contextStore: ClsService
   * })
   * ```
   */
  contextStore: Type<AclContextStore>;

  /**
   * Strict mode for template interpolation in rules
   *
   * - `true`: Throws error if variable/function not found in context
   * - `false` (default): Logs warning and omits field with missing variable
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Development mode - fail fast on configuration errors
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   strictInterpolation: true
   * })
   *
   * // Production mode - graceful degradation
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   strictInterpolation: false
   * })
   * ```
   */
  strictInterpolation?: boolean;

  /**
   * Policy for handling resources with no ACL rules defined
   *
   * - 'deny': Throw 403 Forbidden - DEFAULT (production mode)
   * - 'allow': Allow access + warning in logs (development mode)
   *
   * @default 'deny'
   *
   * @example
   * ```typescript
   * // Production - deny by default (strict)
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   onNoRules: 'deny'
   * })
   *
   * // Development - allow access with warning
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   onNoRules: 'allow'
   * })
   * ```
   */
  onNoRules?: OnNoRulesPolicy;

  /**
   * Дефолтные правила fallback (опционально)
   * Используются когда rulesLoader возвращает пустой массив
   *
   * @example
   * ```typescript
   * AclPermissionsModule.forRoot({
   *   rulesLoader: MyRulesLoader,
   *   defaultRules: [
   *     { action: 'getAll', subject: 'all', inverted: false }
   *   ]
   * })
   * ```
   */
  defaultRules?: AclRule[];

}
