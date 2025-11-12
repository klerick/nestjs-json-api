import type { JsonBaseController } from '@klerick/json-api-nestjs';
import type { AnyEntity } from '@klerick/json-api-nestjs-shared';
import type { AclSubject } from './acl-rules.types';
import { AclModuleOptions } from './acl-options.types';

/**
 * Extract function property names from a type
 */
type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

/**
 * Extract method names from controller class
 */
export type ControllerMethods<T> = FunctionPropertyNames<T>;

export type AclControllerMethodsOptions = boolean | Omit<AclModuleOptions, 'rulesLoader' | 'contextStore' | 'strictInterpolation'>;

/**
 * Partial record of controller methods with boolean values
 * Typed by specific controller class
 */
export type ControllerMethodsConfig<T> = Partial<
  Record<ControllerMethods<T>, AclControllerMethodsOptions>
>;

/**
 * Options for @AclController decorator
 * Generic Controller type allows type-safe method configuration
 */
export interface AclControllerOptions<
  E extends AnyEntity = AnyEntity,
  Controller = JsonBaseController<E, 'id'>
> {
  /**
   * Subject for ACL checks
   * Can be Entity class, instance, or string name
   *
   * @example
   * subject: User
   * subject: 'User'
   */
  subject: AclSubject<E>;

  /**
   * Configuration for which controller methods should have ACL enabled
   * If not specified, all methods are enabled by default
   * Type-safe based on Controller generic parameter
   *
   * @example
   * methods: {
   *   getAll: true,
   *   getOne: true,
   *   postOne: true,
   *   patchOne: false,  // disabled
   *   deleteOne: false, // disabled
   * }
   */
  methods?: ControllerMethodsConfig<Controller>;

  /**
   * Whether ACL is enabled for this controller
   * @default true
   */
  enabled?: boolean;
}

/**
 * Metadata stored by @AclController decorator
 */
export interface AclControllerMetadata<E extends AnyEntity = AnyEntity> {
  subject: AclSubject<E>;
  methods: Record<string, AclControllerMethodsOptions>;
  enabled: boolean;
}
