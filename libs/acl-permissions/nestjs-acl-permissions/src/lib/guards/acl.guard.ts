import { Injectable, CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AclAuthorizationService } from '../services';
import { AclControllerMetadata } from '../types';
import { ACL_CONTROLLER_METADATA } from '../constants';

/**
 * Guard for ACL permission checking
 *
 * Thin wrapper that delegates all logic to AclAuthorizationService
 *
 * Applied automatically by @AclController decorator
 *
 * Lifecycle: Guards run BEFORE interceptors and pipes
 *
 * Benefits:
 * - Fails fast (before handler execution)
 * - Semantic correctness (Guard = authorization)
 * - Supports onNoRules policy (deny/allow/warn)
 */
@Injectable()
export class AclGuard implements CanActivate {
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(Reflector) private readonly reflector!: Reflector;

  private readonly logger = new Logger(AclGuard.name);

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {

    const controller = executionContext.getClass();
    const handler = executionContext.getHandler();
    const controllerName = controller.name;
    const methodName = handler.name;

    const metadata = this.reflector.get<AclControllerMetadata | undefined>(
      ACL_CONTROLLER_METADATA,
      controller
    );

    if (!metadata) {
      this.logger.debug(
        `No @AclController metadata found on ${controllerName}, allowing access`
      );
      return true;
    }

    // If ACL is disabled for this controller
    if (metadata.enabled === false) {
      this.logger.debug(
        `ACL disabled for controller ${controllerName}, allowing access`
      );
      return true;
    }

    // Check if ACL is enabled for this specific method
    const isMethodEnabled = metadata.methods[methodName];

    // If method configuration is explicitly false, allow access
    if (isMethodEnabled === false) {
      this.logger.debug(
        `ACL disabled for method ${controllerName}.${methodName}, allowing access`
      );
      return true;
    }

    // Delegate all logic to authorization service
    return this.moduleRef.get(AclAuthorizationService, {
      strict: false,
    }).authorize(controllerName, methodName, metadata);
  }
}
