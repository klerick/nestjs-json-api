// import { Type } from '@nestjs/common';
// import { DECORATORS } from '@nestjs/swagger/dist/constants';
// import { ApiTags, ApiExtraModels } from '@nestjs/swagger';
// // import { camelToKebab, ObjectTyped } from '../utils';
// // import { FilterOperand } from './filter-operand-model';
// // import { JSON_API_DECORATOR_OPTIONS } from '../../constants';
// // import { DecoratorOptions, Entity, MethodName, ConfigParam } from '../../types';
// import { Bindings } from '../../config/bindings';
// import { swaggerMethod } from './method';
// // import { createApiModels } from './utils';
//
// import { Entity, ConfigParam } from '../../types';
// import { ObjectTyped } from '../utils';
//
// export function setSwaggerDecorator(
//   controller: Type<any>,
//   entity: Entity,
//   config: ConfigParam
// ) {
//   // const apiTag = Reflect.getMetadata(DECORATORS.API_TAGS, controller);
//   // if (!apiTag) {
//   //   const entityName =
//   //     entity instanceof Function ? entity.name : entity.options.name;
//   //
//   //   ApiTags(config?.['overrideRoute'] || `${camelToKebab(entityName)}`)(
//   //     controller
//   //   );
//   // }
//   // ApiExtraModels(FilterOperand)(controller);
//   // ApiExtraModels(createApiModels(entity))(controller);
//   //
//   // const decoratorOptions: DecoratorOptions = Reflect.getMetadata(
//   //   JSON_API_DECORATOR_OPTIONS,
//   //   controller
//   // );
//   //
//   for (const method of ObjectTyped.keys(Bindings)) {
//     // if (decoratorOptions) {
//     //   const { allowMethod = Object.keys(Bindings) } = decoratorOptions;
//     //
//     //   if (!allowMethod.includes(method as MethodName)) {
//     //     continue;
//     //   }
//     // }
//     //
//     if (method in swaggerMethod) {
//       swaggerMethod[method](controller, entity, Bindings[method], config);
//     }
//   }
// }

export * from './method';
export * from './filter-operand-model';
export { createApiModels } from './utils';
