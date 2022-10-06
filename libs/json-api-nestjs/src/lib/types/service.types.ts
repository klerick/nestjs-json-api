import {MethodsService} from '../mixin/service/typeorm/methods';
import {TypeormMixinService} from '../mixin/service/typeorm/typeorm.mixin';
import {QueryParams} from './query.types';
import {RouteParams} from './params.type';
import {ResourceRequestObject} from '../types-common/request';
import {Relationship} from '../types-common';

export type ServiceOptions<T> = ServiceMainOption<T> & ServiceBodyOptions<T>

export interface ServiceMainOption<T> {
  route?: RouteParams;
  query?: QueryParams<T>;
}

export interface ServiceBodyOptions<T> {
  body?: ResourceRequestObject<T>['data'] | Relationship<T>['data'];
}

export interface JsonApiServiceMethode<Entity> {
  getAll: typeof MethodsService.getAll<Entity>,
  getOne: typeof MethodsService.getOne<Entity>,
  deleteOne: typeof MethodsService.deleteOne<Entity>,
  postOne: typeof MethodsService.postOne<Entity>,
  patchOne: typeof MethodsService.patchOne<Entity>,
  getRelationship: typeof MethodsService.getRelationship<Entity>
  deleteRelationship: typeof MethodsService.deleteRelationship<Entity>
  postRelationship: typeof MethodsService.postRelationship<Entity>
  patchRelationship: typeof MethodsService.patchRelationship<Entity>
}

export type JsonApiService<Entity> = TypeormMixinService<Entity>

