import {DECORATORS} from '@nestjs/swagger/dist/constants';
import {ApiTags, ApiExtraModels} from '@nestjs/swagger';
import {camelToKebab} from '../utils';
import {FilterOperand} from './filter-operand-model';
import {
  JSON_API_DECORATOR_OPTIONS
} from '../../constants';
import {NestController, DecoratorOptions, Entity, MethodName, ConfigParam} from '../../types';
import {Bindings} from '../../config/bindings';
import {swaggerMethod} from './method';
import {createApiModels} from './utils'

export function setSwaggerDecorator(controller: NestController, entity: Entity, config: ConfigParam) {
  const apiTag = Reflect.getMetadata(DECORATORS.API_TAGS, controller);
  if (!apiTag) {
    const entityName = entity instanceof Function ? entity.name : entity.options.name;
    ApiTags(camelToKebab(entityName))(controller);
  }
  ApiExtraModels(FilterOperand)(controller);
  ApiExtraModels(createApiModels(entity))(controller);

  const decoratorOptions: DecoratorOptions = Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, controller);


  for (const method in Bindings) {
    if (decoratorOptions) {
      const {allowMethod = []} = decoratorOptions;


      if (!allowMethod.includes(method as MethodName)) {
        continue;
      }
    }

    if (!swaggerMethod[method]) {
      continue;
    }

    swaggerMethod[method](controller, entity, Bindings[method], config);
  }
}
