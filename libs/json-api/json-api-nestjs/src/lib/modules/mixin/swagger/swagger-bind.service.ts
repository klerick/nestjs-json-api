import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from '@nestjs/core';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';

import {
  CONTROLLER_OPTIONS_TOKEN,
  CURRENT_ENTITY,
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_DECORATOR_ENTITY,
} from '../../../constants';
import { getProviderName, nameIt } from '../helpers';
import { JsonBaseController } from '../controllers';
import { EntityClass } from '../../../types';
import { DecoratorOptions } from '../types';
import { FilterOperand } from './filter-operand-model';
import { createApiModels } from './utils';
import { Bindings } from '../config/bindings';

import { swaggerMethod } from './method';
import { EntityParamMapService } from '../service';

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

    ApiTags(this.entity.name)(controller);

    ApiExtraModels(FilterOperand)(controller);
    ApiExtraModels(createApiModels(this.entity, mapProps))(controller);

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
  }
}
