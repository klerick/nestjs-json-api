import { TypeormMixinService } from '../../service/typeorm/typeorm.mixin';
import {
  ControllerTypes,
  JsonApiServiceMethode,
  QueryParams,
} from '../../../types';
import { ResourceRequestObject } from '../../../types-common/request';
import { Relationship } from '../../../types-common';

export class JsonBaseController<Entity> implements ControllerTypes<Entity> {
  serviceMixin: TypeormMixinService<Entity>;

  getAll(
    query: QueryParams<Entity>,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['getAll']> {
    return this.serviceMixin.getAll({ query });
  }

  getOne(
    id: number,
    query: QueryParams<Entity>,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['getOne']> {
    return this.serviceMixin.getOne({
      route: {
        id,
      },
      query,
    });
  }

  deleteOne(
    id: number,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['deleteOne']> {
    return this.serviceMixin.deleteOne({
      route: {
        id,
      },
    });
  }

  postOne(
    body: ResourceRequestObject<Entity>['data'],
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['postOne']> {
    return this.serviceMixin.postOne({
      body,
    });
  }

  patchOne(
    id: number,
    body: ResourceRequestObject<Entity>['data'],
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['patchOne']> {
    return this.serviceMixin.patchOne({
      body,
      ...{
        route: {
          id,
        },
      },
    });
  }

  getRelationship(
    id: number,
    relName: string,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['getRelationship']> {
    return this.serviceMixin.getRelationship({
      route: { id, relName },
    });
  }

  deleteRelationship(
    id: number,
    relName: string,
    body: Exclude<Relationship<Entity>['data'], 'links'>,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['deleteRelationship']> {
    return this.serviceMixin.deleteRelationship({
      route: { id, relName },
      body,
    });
  }

  patchRelationship(
    id: number,
    relName: string,
    body: Exclude<Relationship<Entity>['data'], 'links'>,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['patchRelationship']> {
    return this.serviceMixin.patchRelationship({
      route: { id, relName },
      body,
    });
  }

  postRelationship(
    id: number,
    relName: string,
    body: Exclude<Relationship<Entity>['data'], 'links'>,
    rest
  ): ReturnType<JsonApiServiceMethode<Entity>['postRelationship']> {
    return this.serviceMixin.postRelationship({
      route: { id, relName },
      body,
    });
  }
}
