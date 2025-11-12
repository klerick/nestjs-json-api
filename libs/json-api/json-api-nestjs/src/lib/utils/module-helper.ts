import { ParseIntPipe } from '@nestjs/common';
import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';

import {
  NestController,
  OptionOfConfig,
  Params,
  PrepareParams,
} from '../types';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_DECORATOR_ENTITY,
} from '../constants';

export function prepareConfig<OrmParams>(
  moduleParams: Params<OrmParams>
): PrepareParams<OrmParams> {
  const options = moduleParams['options'] || ({} as OptionOfConfig<OrmParams>);

  return {
    connectionName: moduleParams['connectionName'] || DEFAULT_CONNECTION_NAME,
    imports: moduleParams['imports'] || [],
    providers: moduleParams['providers'] || [],
    controllers: moduleParams['controllers'] || [],
    entities: moduleParams['entities'],
    options: {
      ...options,
      operationUrl: options['operationUrl'] || undefined,
      requiredSelectField: !!options['requiredSelectField'],
      debug: !!options['debug'],
      pipeForId: options['pipeForId'] || ParseIntPipe,
      allowSetId: !!options['allowSetId']
    },
    hooks: {
      afterCreateController: moduleParams['hooks'] && moduleParams['hooks']['afterCreateController'] || (() => void 0)
    }
  };
}

export function getController(
  entity: EntityClass<AnyEntity>,
  controllers: NestController
) {
  return controllers.find(
    (item) =>
      item && Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, item) === entity
  );
}
