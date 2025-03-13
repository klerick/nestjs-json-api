import { DynamicModule } from '@nestjs/common';
import { expectType, expectError, expectNotType } from 'tsd';

import { Params, ParamsModule } from './module-options.types';

class Test {}

const paramsCheck: Params = {
  entities: [Test],
  options: {
    operationUrl: '',
    debug: true,
  },
  imports: [],
  connectionName: 'test',
  controllers: [],
  providers: [],
};

expectType<Params>(paramsCheck);
expectNotType<Params>({
  ...paramsCheck,
  options: {
    ...paramsCheck.options,
    extraField: true,
  },
});

type ExtraOptions = {
  extraField: boolean;
};

const extraOptions: ExtraOptions = {
  extraField: true,
};

const extendParamCheck: Params<ExtraOptions> = {
  ...paramsCheck,
  options: {
    ...paramsCheck.options,
    ...extraOptions,
  },
};

expectType<Params<ExtraOptions>>(extendParamCheck);

expectNotType<Params<ExtraOptions>>(paramsCheck);
expectNotType<Params<ExtraOptions>>({
  ...extendParamCheck,
  options: {
    ...extendParamCheck.options,
    extraErrorField: true,
  },
});

const paramsCheckWithoutOptions: Params = {
  entities: [Test],
  imports: [],
  connectionName: 'test',
  controllers: [],
  providers: [],
};

expectType<Params>(paramsCheckWithoutOptions);
expectNotType<Params<ExtraOptions>>(paramsCheckWithoutOptions);

class ClassModule {
  static forRoot(options: Params<ExtraOptions>): DynamicModule {
    return {} as any;
  }
}
class ClassModuleWithoutExtra {
  static forRoot(options: Params<NonNullable<unknown>>): DynamicModule {
    return {} as any;
  }
}

const paramsModule: ParamsModule<typeof ClassModule> = {
  entities: [Test],
  imports: [],
  connectionName: 'test',
  controllers: [],
  providers: [],
  options: {
    extraField: true,
  },
};

expectType<ParamsModule<typeof ClassModule>>(paramsModule);
expectNotType<ParamsModule<typeof ClassModuleWithoutExtra>>(paramsModule);
