import {
  Module,
  DynamicModule,
  Inject,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ACL_MODULE_OPTIONS } from './constants';
import type { AclModuleOptions } from './types';
import { AclAuthorizationService, RuleMaterializer } from './services';
import { AclGuard } from './guards';
import { AbilityFactoryProvider, AbilityProvider } from './factories';

@Module({})
export class AclPermissionsModule implements OnModuleInit {
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(ACL_MODULE_OPTIONS) private readonly options!: AclModuleOptions;
  private readonly logger = new Logger(AclPermissionsModule.name);
  static forRoot(options: AclModuleOptions): DynamicModule {
    return {
      module: AclPermissionsModule,
      providers: [
        {
          provide: ACL_MODULE_OPTIONS,
          useValue: options,
        },
        AclGuard,
        AclAuthorizationService,
        RuleMaterializer,
        AbilityFactoryProvider,
        AbilityProvider,
      ],
      exports: [AclGuard, AclAuthorizationService, AbilityProvider],
    };
  }

  onModuleInit() {
    try {
      this.moduleRef.get(this.options.rulesLoader, {strict: false});
      this.moduleRef.get(this.options.contextStore, {strict: false});
    } catch (error) {
      this.logger.warn(
        `RulesLoader or ContextStore not found, ACL will not work`
      );
      throw error;
    }
  }
}
