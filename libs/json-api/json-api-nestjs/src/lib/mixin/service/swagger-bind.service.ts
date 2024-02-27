import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { JsonBaseController } from '../controller/json-base.controller';
import { Repository } from 'typeorm';
import {
  CONTROL_OPTIONS_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
  JSON_API_CONTROLLER_POSTFIX,
  JSON_API_DECORATOR_ENTITY,
  SWAGGER_METHOD,
} from '../../constants';

import {
  createApiModels,
  ObjectTyped,
  swaggerMethod,
  SwaggerMethod,
  FilterOperand,
  nameIt,
  getProviderName,
} from '../../helper';
import { Bindings } from '../../config/bindings';
import { DecoratorOptions, Entity } from '../../types';

@Injectable()
export class SwaggerBindService<E extends Entity> implements OnModuleInit {
  @Inject(CURRENT_ENTITY_REPOSITORY) private repository!: Repository<E>;
  @Inject(DiscoveryService) private discoveryService!: DiscoveryService;
  @Inject(SWAGGER_METHOD) private swaggerMethod!: SwaggerMethod;
  @Inject(CONTROL_OPTIONS_TOKEN) private config!: DecoratorOptions;

  public initSwagger() {
    const controllerName = nameIt(
      getProviderName(this.repository.target, JSON_API_CONTROLLER_POSTFIX),
      JsonBaseController
    ).name;

    const controllerInst = this.discoveryService
      .getControllers()
      .find(
        (i) =>
          i.name === controllerName ||
          this.repository.target ===
            Reflect.getMetadata(
              JSON_API_DECORATOR_ENTITY,
              i.instance.constructor
            )
      );
    if (!controllerInst)
      throw new Error(
        `Controller for ${this.repository.metadata.name} is empty`
      );
    const controller = controllerInst.instance.constructor;
    const apiTag = Reflect.getMetadata(DECORATORS.API_TAGS, controller);
    if (!apiTag) {
      ApiTags(this.config['overrideRoute'] || this.repository.metadata.name)(
        controller
      );
    }

    ApiTags(this.repository.metadata.name)(controller);

    ApiExtraModels(FilterOperand)(controller);
    ApiExtraModels(createApiModels(this.repository))(controller);

    const { allowMethod = Object.keys(Bindings) } = this.config;
    for (const method of ObjectTyped.keys(Bindings)) {
      if (!allowMethod.includes(method)) continue;

      if (method in swaggerMethod) {
        swaggerMethod[method](
          controller.prototype,
          this.repository,
          Bindings[method],
          this.config
        );
      }
      Reflect.defineMetadata(
        PARAMTYPES_METADATA,
        [Object],
        controller.prototype,
        method
      );
    }
  }

  onModuleInit(): any {
    this.initSwagger();
  }
}
