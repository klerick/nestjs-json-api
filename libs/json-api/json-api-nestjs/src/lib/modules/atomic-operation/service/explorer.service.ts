import { Inject, Injectable, Type } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { ModulesContainer } from '@nestjs/core';
import { EntityRelation } from '../../../utils/nestjs-shared';
import { MAP_CONTROLLER_ENTITY, MAP_ENTITY } from '../constants';
import { MapController, MapEntity, OperationMethode } from '../types';
import { ObjectLiteral as Entity } from '../../../types';
import { InputArray, Operation } from '../utils';
import { JsonBaseController } from '../../mixin/controller/json-base.controller';
import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
} from '../../mixin/zod';

@Injectable()
export class ExplorerService<E extends Entity = Entity> {
  @Inject(ModulesContainer)
  private readonly modulesContainer!: ModulesContainer;

  @Inject(MAP_ENTITY) private readonly mapEntity!: MapEntity;
  @Inject(MAP_CONTROLLER_ENTITY) private readonly mapController!: MapController;

  private mapModuleByController = new Map<
    Type<JsonBaseController<E>>,
    Module
  >();

  getControllerByEntityName(entityName: string): Type<JsonBaseController<E>> {
    const entity = this.mapEntity.get(entityName);
    if (!entity) {
      throw new Error();
    }

    const controller = this.mapController.get(entity);
    if (!controller) {
      throw new Error();
    }

    return controller;
  }

  getMethodNameByParam(
    operation: Operation,
    id?: string,
    rel?: string
  ): OperationMethode<E> {
    switch (operation) {
      case Operation.add:
        return id ? 'postRelationship' : 'postOne';
      case Operation.remove:
        return rel ? 'deleteRelationship' : 'deleteOne';
      case Operation.update:
        return rel ? 'patchRelationship' : 'patchOne';
      default:
        throw new Error();
    }
  }

  getParamsForMethod(
    methodName: OperationMethode<E>,
    data: InputArray[number]
  ): Parameters<JsonBaseController<E>[typeof methodName]> {
    const { op, ref, ...other } = data;
    switch (methodName) {
      case 'postOne':
        return [other as PostData<E>];
      case 'patchOne':
        return [ref.id as string, other as PatchData<E>];
      case 'deleteOne':
        return [ref.id as string];
      case 'deleteRelationship':
        return [
          ref.id as string,
          ref.relationship as EntityRelation<E>,
          other as PostRelationshipData,
        ];
      case 'patchRelationship':
        return [
          ref.id as string,
          ref.relationship as EntityRelation<E>,
          other as PatchRelationshipData,
        ];
      case 'postRelationship':
        return [
          ref.id as string,
          ref.relationship as EntityRelation<E>,
          other as PostRelationshipData,
        ];
    }
  }

  getModulesByController(controllers: Type<JsonBaseController<E>>): Module {
    const module = this.mapModuleByController.get(controllers);
    if (module) {
      return module;
    }

    const findModule = [...this.modulesContainer.values()].find((i) =>
      [...i.controllers.values()].find((c) => c.name === controllers.name)
    );
    if (findModule) {
      return findModule;
    }

    throw new Error();
  }
}
