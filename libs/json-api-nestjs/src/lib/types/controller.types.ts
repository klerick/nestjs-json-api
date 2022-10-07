import { JsonApiServiceMethode } from './service.types';
import {QueryParams} from './query.types';
import {ResourceRequestObject} from '../types-common/request';
import {Relationship} from '../types-common';
import {TypeormMixinService} from '../mixin/service/typeorm/typeorm.mixin';


export interface ControllerTypes<Entity>{
  serviceMixin: JsonApiServiceMethode<Entity>;
  getAll:(query: QueryParams<Entity>, ...rest)  => ReturnType<JsonApiServiceMethode<Entity>['getAll']>,
  getOne: (id:number, query: QueryParams<Entity>, ...rest) => ReturnType<JsonApiServiceMethode<Entity>['getOne']>,
  deleteOne: (id: number, ...rest) => ReturnType<JsonApiServiceMethode<Entity>['deleteOne']>,
  postOne: (body: ResourceRequestObject<Entity>['data'], ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['postOne']>,
  patchOne: (id: number, body: ResourceRequestObject<Entity>['data'], ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['patchOne']>,
  getRelationship: (id: number, relName: string, ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['getRelationship']>,
  deleteRelationship: (id: number, relName: string, body: Exclude<Relationship<Entity>['data'], 'links'>, ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['deleteRelationship']>,
  postRelationship: (id: number, relName: string, body: Exclude<Relationship<Entity>['data'], 'links'>, ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['postRelationship']>,
  patchRelationship: (id: number, relName: string, body: Exclude<Relationship<Entity>['data'], 'links'>, ...rest ) => ReturnType<JsonApiServiceMethode<Entity>['patchRelationship']>,
}
