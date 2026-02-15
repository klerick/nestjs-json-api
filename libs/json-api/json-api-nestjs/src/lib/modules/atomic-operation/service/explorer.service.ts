import { Inject, Injectable, Type } from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';
import { ModulesContainer } from '@nestjs/core';
import { RelationKeys, Operation } from '@klerick/json-api-nestjs-shared';
import { MAP_CONTROLLER_ENTITY, MAP_ENTITY } from '../constants';
import { MapController, MapEntity, OperationMethode } from '../types';

import { InputArray } from '../utils';
import { JsonBaseController } from '../../mixin/controllers/json-base.controller';

@Injectable()
export class ExplorerService<E extends object = object> {
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
        return rel ? 'postRelationship' : 'postOne';
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
    const { ref, data: operationData, meta } = data;

    const requestBody = { data: operationData, meta };

    switch (methodName) {
      case 'postOne':
        return [requestBody, requestBody] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
      case 'patchOne':
        return [ref.id as string, requestBody, requestBody] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
      case 'deleteOne':
        return [ref.id as string] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
      case 'deleteRelationship':
        return [
          ref.id as string,
          ref.relationship as RelationKeys<E>,
          requestBody,
          requestBody,
        ] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
      case 'patchRelationship':
        return [
          ref.id as string,
          ref.relationship as RelationKeys<E>,
          requestBody,
          requestBody,
        ] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
      case 'postRelationship':
        return [
          ref.id as string,
          ref.relationship as RelationKeys<E>,
          requestBody,
          requestBody,
        ] as unknown as Parameters<JsonBaseController<E>[typeof methodName]>;
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
