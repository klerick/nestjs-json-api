import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from '@nestjs/core';
import { ObjectTyped, EntityClass } from '@klerick/json-api-nestjs-shared';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';

import {
  CONTROLLER_OPTIONS_TOKEN,
  CURRENT_ENTITY,
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_DECORATOR_ENTITY,
} from '../../../constants';
import { getProviderName, nameIt } from '../helpers';
import { JsonBaseController } from '../controllers';
import { DecoratorOptions } from '../types';
import { FilterOperand } from './filter-operand-model';
import { createApiModels, ZodSchemaRef, ensureZodSchemasRegistered } from './utils';
import { Bindings } from '../config/bindings';

import { swaggerMethod } from './method';
import { EntityParamMapService } from '../service';
import { JsonApiErrorResponseModel } from './error-response-model';
import {
  JSON_API_RESPONSE_FROM,
  JsonApiResponseFromMeta,
} from '../decorators';

@Injectable()
export class SwaggerBindService<E extends object, IdKey extends string = 'id'>
  implements OnModuleInit
{
  @Inject(CURRENT_ENTITY) private entity!: EntityClass<E>;
  @Inject(DiscoveryService) private discoveryService!: DiscoveryService;
  @Inject(CONTROLLER_OPTIONS_TOKEN) private config!: DecoratorOptions;

  @Inject(EntityParamMapService) private mapEntity!: EntityParamMapService<
    E,
    IdKey
  >;

  onModuleInit() {
    this.initSwagger();
  }

  public initSwagger() {
    const controllerName = nameIt(
      getProviderName(this.entity, JSON_API_CONTROLLER_POSTFIX),
      JsonBaseController
    ).name;

    const controllerInst = this.discoveryService
      .getControllers()
      .find(
        (i) =>
          i.name === controllerName ||
          this.entity ===
            Reflect.getMetadata(
              JSON_API_DECORATOR_ENTITY,
              i.instance.constructor
            )
      );
    if (!controllerInst)
      throw new Error(`Controller for ${this.entity.name} is empty`);

    const mapProps = this.mapEntity.getParamMap(this.entity);
    if (!mapProps)
      throw new Error(`ZodEntityProps for ${this.entity.name} is empty`);

    const controller = controllerInst.instance.constructor;
    const apiTag = Reflect.getMetadata(DECORATORS.API_TAGS, controller);
    if (!apiTag) {
      ApiTags(this.config['overrideRoute'] || this.entity.name)(controller);
    }

    ApiExtraModels(FilterOperand)(controller);
    ApiExtraModels(JsonApiErrorResponseModel)(controller);
    ApiExtraModels(createApiModels(this.entity, mapProps))(controller);
    ensureZodSchemasRegistered();
    ApiExtraModels(ZodSchemaRef)(controller);


    const { allowMethod = ObjectTyped.keys(Bindings) } = this.config;
    for (const method of ObjectTyped.keys(Bindings)) {
      if (!allowMethod.includes(method)) continue;

      if (!(method in swaggerMethod)) continue;

      const descriptor = Reflect.getOwnPropertyDescriptor(
        controller.prototype,
        method
      );
      if (!descriptor)
        throw new Error(
          `Descriptor for entity controller ${this.entity.name} is empty`
        );

      swaggerMethod[method](
        controller.prototype,
        descriptor,
        this.entity,
        this.mapEntity,
        method
      );

      Reflect.defineMetadata(
        PARAMTYPES_METADATA,
        [Object],
        controller.prototype,
        method
      );
    }

    // Process JsonApiResponseFrom decorators on custom methods
    this.processJsonApiResponseFrom(controller);
  }

  private processJsonApiResponseFrom(controller: any) {
    const responseMeta: JsonApiResponseFromMeta | undefined =
      Reflect.getMetadata(JSON_API_RESPONSE_FROM, controller);

    if (!responseMeta) return;

    const prototype = controller.prototype;

    for (const [targetMethod, sourceMapping] of Object.entries(responseMeta)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(prototype, targetMethod);
      if (!descriptor) continue;
      const targetResponses = Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        descriptor.value
      );
      if (!targetResponses) continue;

      for (const [sourceMethod, mappings] of Object.entries(sourceMapping)) {
        const sourceDescriptor = Reflect.getOwnPropertyDescriptor(
          prototype,
          sourceMethod
        );
        if (!sourceDescriptor) continue;
        const sourceResponses = Reflect.getMetadata(
          DECORATORS.API_RESPONSE,
          sourceDescriptor.value
        );

        if (!sourceResponses || !mappings) continue;

        for (const { fromStatus, toStatus } of [...mappings]) {
          const sourceResponse = sourceResponses[fromStatus];
          if (!sourceResponse?.schema) continue;

          const existingTarget = targetResponses[toStatus] || {};
          ApiResponse({
            status: toStatus,
            ...existingTarget,
            schema: sourceResponse.schema,
          })(prototype, targetMethod, descriptor);
        }
      }

    }
  }
}
