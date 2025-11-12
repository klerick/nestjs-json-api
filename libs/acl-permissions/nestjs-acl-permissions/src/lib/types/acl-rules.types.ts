import type { MongoQuery } from '@casl/ability';
import type { MethodName } from '@klerick/json-api-nestjs';
import type { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';

/**
 * Reserved variable name for external input data in rule templates
 * This data comes from outside (request body, query params, database entity, etc.)
 * and is NOT part of the context returned by getContext()
 *
 * In templates, use @input (with @) for readability: '${@input.userId}'
 * Internally, the @ symbol is removed before interpolation since @ is not valid in JS variable names
 *
 * @example
 * ```typescript
 * // In rule template (user-facing):
 * { conditions: { ownerId: '${@input.userId}' } }
 *
 * // Internally reserved variable name (without @):
 * const scope = { input: externalData };
 * ```
 */
export const ACL_INPUT_VAR = 'input' as const;

/**
 * Template placeholder with @ symbol for user-facing templates
 * This is replaced with ACL_INPUT_VAR before interpolation
 */
export const ACL_INPUT_TEMPLATE = '@input' as const;

/**
 * Type for external input data
 *
 * TODO: Extend to support both new input AND old values from database
 * Use case: In patchOne, we need to compare old value vs new value in rules
 * Example: Allow removing only self from coAuthorIds array
 * - Current: { coAuthorIds: [1, 2, 3] } from DB
 * - New: { coAuthorIds: [1, 3] } from @input
 * - Helper: isOnlyRemovedUser(@input.__current.coAuthorIds, @input.coAuthorIds, userId)
 *
 * Proposed structure:
 * - @input.* - new values from request
 * - @input.__current.* - old values from database (for patchOne only)
 */
export type AclInputData = Record<string, any>;

/**
 * Utility type to exclude reserved @input variable from context/helpers
 */
type WithoutReservedVars<T extends Record<string, any>> = {
  [K in keyof T as K extends typeof ACL_INPUT_VAR ? never : K]: T[K];
};

/**
 * Type for CASL action
 * Can be any method from JsonBaseController or custom string
 */
export type AclAction<E extends MethodName | string = MethodName | string> = E;

/**
 * Type for CASL subject - entity class or instance
 * Can be:
 * - Entity class (e.g., User, Post)
 * - Entity instance (e.g., new User())
 * - String with entity name (e.g., 'User', 'Post')
 */
export type AclSubject<E extends AnyEntity = AnyEntity> =
  | EntityClass<E>
  | E
  | string;

/**
 * ACL rule definition
 */
export interface AclRule<
  E extends AnyEntity = AnyEntity,
  Action extends string = string
> {
  /**
   * Action to check (e.g., 'getAll', 'postOne', 'patchOne', etc.)
   */
  action: Action;

  /**
   * Subject to check against (entity class or name)
   */
  subject: AclSubject<E>;

  /**
   * Optional conditions (MongoDB query format)
   */
  conditions?: MongoQuery<E>;

  /**
   * Optional fields restriction
   */
  fields?: Array<keyof E | string>;

  /**
   * Whether this is an inverted rule (cannot)
   */
  inverted?: boolean;

  /**
   * Optional reason for the rule
   */
  reason?: string;
}

/**
 * Interface for loading ACL rules from external source
 * Implementation is provided by the user
 */
export interface AclRulesLoader {
  /**
   * Loads ACL rules for the current request
   *
   * @param subject - Entity class or name of subject for which to load rules
   * @param action - Action being performed (method name from JsonBaseController)
   * @returns Array of CASL rules in JSON format (may contain template strings like '${userId}')
   *
   * @example
   * ```typescript
   * @Injectable()
   * class MyRulesLoader implements AclRulesLoader {
   *   async loadRules<E extends AnyEntity>(
   *     entity: EntityClass<E>,
   *     action: AclAction
   *   ): Promise<AclRule<E>[]> {
   *     const user = this.request.user;
   *     const rules = await this.db.query(
   *       'SELECT * FROM permissions WHERE userId = ? AND entity = ? AND action = ?',
   *       [user.id, entity.name, action]
   *     );
   *     return rules.map(r => ({
   *       action: r.action,
   *       subject: entity,
   *       conditions: r.conditions, // May contain: { userId: '${userId}' }
   *       fields: r.fields
   *     }));
   *   }
   * }
   * ```
   */
  loadRules<E extends AnyEntity>(
    subject: AclSubject<E>,
    action: AclAction
  ): Promise<AclRule<E>[]>;

  /**
   * Provides context variables for template interpolation in rules
   *
   * IMPORTANT: Cannot use reserved variable name 'input' - it's reserved for external input data
   * In templates, write @input which gets converted to input internally
   *
   * @returns Promise with object containing variables (without 'input' key)
   *
   * @example
   * ```typescript
   * @Injectable()
   * class MyRulesLoader implements AclRulesLoader {
   *   constructor(
   *     @Inject(REQUEST) private request: Request,
   *     private usersService: UsersService
   *   ) {}
   *
   *   async getContext() {
   *     const user = this.request.user;
   *     const userGroups = await this.usersService.getUserGroups(user.id);
   *
   *     return {
   *       userId: user.id,
   *       userEmail: user.email,
   *       userData: {
   *         groups: userGroups,
   *         roles: user.roles,
   *       },
   *       // 'input': {} // ← TypeScript error: reserved variable
   *     };
   *   }
   * }
   * ```
   */
  getContext(): Promise<WithoutReservedVars<Record<string, unknown>>>;

  /**
   * Provides custom helper functions for template interpolation in rules
   *
   * These functions can be used in rule templates like: '${getValProps(@input.userGroups, "id")}'
   *
   * IMPORTANT: Cannot use reserved function name 'input' - it's reserved for external input data
   * In templates, write @input which gets converted to input internally
   *
   * @returns Promise with object containing helper functions (without 'input' key)
   *
   * @example
   * ```typescript
   * @Injectable()
   * class MyRulesLoader implements AclRulesLoader {
   *   async getHelpers() {
   *     return {
   *       // Extract property values from array of objects
   *       getValProps: (arr: any[], prop: string) => arr.map(item => item[prop]),
   *
   *       // Check if array contains value
   *       includes: (arr: any[], value: any) => arr.includes(value),
   *
   *       // Get current timestamp
   *       now: () => Date.now(),
   *
   *       // Custom business logic
   *       isOwner: (resource: any, userId: number) => resource.ownerId === userId,
   *
   *       // 'input': () => {} // ← TypeScript error: reserved variable
   *     };
   *   }
   * }
   *
   * // Usage in rule template:
   * // { groupIds: { $in: '${getValProps(@input.userGroups, "id")}' } }
   * // { ownerId: '${@input.userId}' }
   * ```
   */
  getHelpers(): Promise<WithoutReservedVars<Record<string, (...args: any[]) => any>>>;
}
