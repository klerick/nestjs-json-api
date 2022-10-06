import { Repository } from 'typeorm';

import {MethodsService} from './methods';
import {TransformMixinService} from '../transform/transform.mixin';
import {
  JsonApiServiceMethode,
  ServiceOptions,
  ConfigParam,
} from '../../../types';
import {Meta, Relationship, ResourceObject} from '../../../types-common';
import {UtilsMethode} from './utils/utils-methode'

export class TypeormMixinService<Entity> implements JsonApiServiceMethode<Entity> {
  protected UtilsMethode = UtilsMethode

  constructor(
    protected repository: Repository<Entity>,
    protected config: ConfigParam,
    protected transform: TransformMixinService<Entity>,
  ) {
  }

  getAll(this: TypeormMixinService<Entity>, options: ServiceOptions<Entity>): Promise<ResourceObject<Entity>> {
    return MethodsService.getAll.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<ResourceObject<Entity>>
    >(this, options)
  }

  getOne(options: ServiceOptions<Entity>): Promise<ResourceObject<Entity>> {
    return MethodsService.getOne.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<ResourceObject<Entity>>
      >(this, options)
  }

  deleteOne(options: ServiceOptions<Entity>): Promise<void> {
    return MethodsService.deleteOne.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<void>
      >(this, options)
  }

  postOne(options: ServiceOptions<Entity>): Promise<ResourceObject<Entity>> {
    return MethodsService.postOne.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<ResourceObject<Entity>>
      >(this, options)
  }

  patchOne(options: ServiceOptions<Entity>): Promise<ResourceObject<Entity>> {
    return MethodsService.patchOne.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<ResourceObject<Entity>>
      >(this, options)
  }

  getRelationship(options: ServiceOptions<Entity>): Promise<{ meta?: Partial<Meta> } & Relationship<Entity>> {
    return MethodsService.getRelationship.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<{
        meta?: Partial<Meta>;
      } & Relationship<Entity>>
      >(this, options);
  }

  deleteRelationship(options: ServiceOptions<Entity>): Promise<void> {
    return MethodsService.deleteRelationship.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<void>
      >(this, options);
  }

  postRelationship(options: ServiceOptions<Entity>): Promise<{ meta?: Partial<Meta> } & Relationship<Entity>> {
    return MethodsService.postRelationship.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<{
        meta?: Partial<Meta>;
      } & Relationship<Entity>>
      >(this, options);
  }

  patchRelationship(options: ServiceOptions<Entity>): Promise<{ meta?: Partial<Meta> } & Relationship<Entity>> {
    return MethodsService.patchRelationship.call<
      TypeormMixinService<Entity>,
      [ServiceOptions<Entity>],
      Promise<{
        meta?: Partial<Meta>;
      } & Relationship<Entity>>
      >(this, options);
  }

}



