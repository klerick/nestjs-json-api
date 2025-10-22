import { MethodName } from './binding.type';

import { PrepareParams } from '../../../types';

type ControllerOptions = {
  allowMethod: Array<MethodName>;
  overrideRoute: string;
  allowSetId: boolean
};

export type DecoratorOptions<OrmParams = NonNullable<unknown>> = Partial<
  ControllerOptions & Omit<PrepareParams<OrmParams>['options'], 'operationUrl'>
>;

export type EntityControllerParam<OrmParams = NonNullable<unknown>> =
  PrepareParams<OrmParams>['options'] & DecoratorOptions;
