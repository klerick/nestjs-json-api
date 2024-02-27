import {
  AtomicFactory,
  AtomicFactoryPromise,
  FunctionProperty,
  FunctionPropertyNames,
  JsonConfig,
  PromiseJsonApiSdkService,
} from './types';
import { resultConfig } from './utils';
import {
  AtomicOperationsService,
  JsonApiSdkService,
  JsonApiUtilsService,
} from './service';
import { FetchInnerClient } from './service/fetch-inner-client';
import { lastValueFrom } from 'rxjs';

export type JsonSdkPromise = {
  jsonApiUtilsService: JsonApiUtilsService;
  jonApiSdkService: PromiseJsonApiSdkService;
  atomicFactory: AtomicFactoryPromise;
};

export type JsonSdkGeneral = {
  jsonApiUtilsService: JsonApiUtilsService;
  jonApiSdkService: JsonApiSdkService;
  atomicFactory: AtomicFactory;
};

type JsonSdk<P extends boolean | undefined> = P extends true
  ? JsonSdkPromise
  : JsonSdkGeneral;

const jsonSdk = {} as any;

export function JsonApiJs<P extends true | boolean>(
  config: JsonConfig,
  returnPromise?: P
): JsonSdk<P> {
  if (Object.keys(jsonSdk).length > 0) return jsonSdk;
  const { adapter, ...jsonSdkConfig } = config;
  const resultJsonConfig = resultConfig(jsonSdkConfig);

  const jsonApiUtilsService = new JsonApiUtilsService(resultJsonConfig);
  const httpInnerClient = adapter ? adapter : new FetchInnerClient();
  const jonApiSdkService = new JsonApiSdkService(
    httpInnerClient,
    jsonApiUtilsService,
    resultJsonConfig
  );
  jsonSdk['jsonApiUtilsService'] = jsonApiUtilsService;
  jsonSdk['jonApiSdkService'] = jonApiSdkService;
  jsonSdk['atomicFactory'] = () =>
    new AtomicOperationsService(
      jsonApiUtilsService,
      resultJsonConfig,
      httpInnerClient
    );

  if (returnPromise) {
    jsonSdk['jonApiSdkService'] = new Proxy(jonApiSdkService, {
      get<
        T extends JsonApiSdkService,
        R extends FunctionPropertyNames<PromiseJsonApiSdkService>,
        K extends FunctionProperty<T, R>
      >(target: T, p: R): PromiseJsonApiSdkService[R] {
        return (...arg: any): any =>
          lastValueFrom((target[p] as K).apply(target, arg));
      },
    });

    jsonSdk['atomicFactory'] = () => {
      const proxy = new Proxy(
        new AtomicOperationsService(
          jsonApiUtilsService,
          resultJsonConfig,
          httpInnerClient
        ),
        {
          get<
            A extends [],
            T extends AtomicOperationsService<A>,
            R extends keyof AtomicOperationsService<A>
          >(target: T, p: R): any {
            if (p === 'run') {
              return () => lastValueFrom(target.run()) as any;
            }

            if (typeof target[p] === 'function') {
              return (...arg: any) => {
                // @ts-ignore
                target[p](...arg);
                return proxy;
              };
            }
            return target[p] as any;
          },
        }
      );

      return proxy;
    };
  }

  return jsonSdk;
}
