import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';
import * as swaggerUi from 'swagger-ui-express';

import { SwaggerService } from './services/swagger/swagger.service';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_CONFIG,
  JSON_API_ENTITY,
} from './constants';
import { ModuleConfig, ModuleOptions } from './types';
import { moduleMixin } from './mixins';

import { DECORATORS } from '@nestjs/swagger/dist/constants';

@Module({})
export class JsonApiModule implements OnModuleInit {
  private static connectionName = DEFAULT_CONNECTION_NAME;

  public constructor(
    protected moduleRef: ModuleRef,
    protected adapterHost: HttpAdapterHost
  ) {}

  public onModuleInit(): void {
    (SwaggerService.getEntities() as { name: string }[]).forEach(
      async (entity) => {
        const repoName =
          JsonApiModule.connectionName === DEFAULT_CONNECTION_NAME
            ? `${entity.name}Repository`
            : `${JsonApiModule.connectionName}_${entity.name}Repository`;

        const repository = this.moduleRef.get(repoName, { strict: false });
        SwaggerService.addResourceConfig(repository.metadata);
      }
    );
    const config = SwaggerService.getConfig();

    if (!config.hideSwaggerRoute) {
      const document = SwaggerService.prepareDocument();
      const { httpAdapter } = this.adapterHost;

      const swaggerHtml = swaggerUi.generateHTML(document, {});
      httpAdapter.get(`/${config.prefix}`, (req, res) => res.send(swaggerHtml));
      httpAdapter.use(`/${config.prefix}`, swaggerUi.serveFiles(document, {}));
    }
  }

  public static forRoot(options: ModuleOptions): DynamicModule {
    const { globalPrefix } = options;
    const optionsProviders = options.providers || [];
    const optionsImports = options.imports || [];
    JsonApiModule.connectionName =
      options.connectionName || JsonApiModule.connectionName;

    const moduleParams: DynamicModule = {
      module: JsonApiModule,
      controllers: [],
      providers: [
        ...optionsProviders,
        {
          provide: JSON_API_CONFIG,
          useValue: {
            globalPrefix,
          } as ModuleConfig,
        },
      ],
      imports: [
        TypeOrmModule.forFeature(
          options.entities,
          JsonApiModule.connectionName
        ),
        ...optionsImports,
      ],
    };

    const swaggerOptions = options.swagger || {};
    SwaggerService.setConfig({
      ...swaggerOptions,
      apiPrefix: swaggerOptions.apiPrefix || globalPrefix,
    });

    const getOtherEndpoints = (controller, entity) => {
      if (
        !controller ||
        !Reflect.hasOwnMetadata(DECORATORS.API_TAGS, controller)
      ) {
        return;
      }

      const methodNames = Object.getOwnPropertyNames(
        controller.prototype
      ).filter((methodName) =>
        Reflect.hasOwnMetadata(
          DECORATORS.API_RESPONSE,
          controller.prototype[methodName]
        )
      );
      const entityName = entity.name;

      return methodNames.map((methodName) => {
        const path = Reflect.getMetadata(
          'path',
          controller.prototype[methodName]
        );
        const method = Reflect.getMetadata(
          'method',
          controller.prototype[methodName]
        );
        const response = Reflect.getMetadata(
          DECORATORS.API_RESPONSE,
          controller.prototype[methodName]
        );
        const operation = Reflect.getMetadata(
          DECORATORS.API_OPERATION,
          controller.prototype[methodName]
        );
        return { path, method, response, operation, entityName, methodName };
      });
    };

    options.entities.forEach((entity) => {
      const controller = (options.controllers || []).find(
        (item) => Reflect.getMetadata(JSON_API_ENTITY, item) === entity
      );
      const module = moduleMixin(
        globalPrefix,
        controller,
        entity,
        JsonApiModule.connectionName
      );

      moduleParams.controllers = [
        ...moduleParams.controllers,
        module.controller,
      ];
      moduleParams.providers = [...moduleParams.providers, ...module.providers];

      const otherEndpoints = getOtherEndpoints(controller, entity);
      if (otherEndpoints) {
        SwaggerService.otherEndpoints.push(...otherEndpoints);
      }

      SwaggerService.addEntity(entity);
    });
    // console.log(moduleParams)
    return moduleParams;
  }
}
