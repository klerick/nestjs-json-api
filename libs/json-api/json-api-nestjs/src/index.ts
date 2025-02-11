export { JsonApiModule } from './lib/json-api.module';
export { TypeOrmJsonApiModule, MicroOrmJsonApiModule } from './lib/modules';

export { JsonApi, InjectService } from './lib/modules/mixin/decorators';
export { OrmService as JsonApiService } from './lib/modules/mixin/types';
export { JsonBaseController } from './lib/modules/mixin/controller/json-base.controller';
export {
  Query,
  PatchData,
  PostData,
  PostRelationshipData,
  PatchRelationshipData,
} from './lib/modules/mixin/zod';

export {
  EntityRelation,
  ResourceObject,
  ResourceObjectRelationships,
  QueryField,
} from './lib/utils/nestjs-shared';

export { excludeMethod } from './lib/modules/mixin/config/bindings';
export { entityForClass } from './lib/utils';
