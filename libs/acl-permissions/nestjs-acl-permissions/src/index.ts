/**
 * NestJS ACL Permissions Module
 * CASL-based access control for JSON API controllers
 */

// Main module
export { AclPermissionsModule } from './lib/nestjs-acl-permissions.module';

export { AclAction, AclRule, AclRulesLoader, AclSubject } from './lib/types';
export { ExtendAbility } from './lib/factories';
export { wrapperJsonApiController } from './lib/wrappers';
