import 'reflect-metadata';

import {
  JSON_API_DECORATOR_ENTITY,
  JSON_API_DECORATOR_OPTIONS,
} from '../../../../constants';
import { JsonApi } from './json-api.decorator';

import { Bindings } from '../../config/bindings';
import { DecoratorOptions } from '../../types';
import { excludeMethod } from '../../helpers';

describe('InjectServiceDecorator', () => {
  it('should save entity in class', () => {
    class SomeEntity {}

    @JsonApi(SomeEntity)
    class SomeClass {}

    const data = Reflect.getMetadata(JSON_API_DECORATOR_ENTITY, SomeClass);
    expect(data).toBe(SomeEntity);
  });

  it('should save options in class', () => {
    class SomeEntity {}
    const apiOptions: DecoratorOptions = {
      allowMethod: ['getAll', 'deleteRelationship'],
    };

    @JsonApi(SomeEntity, apiOptions)
    class SomeClass {}

    const data = Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, SomeClass);
    expect(data).toEqual(apiOptions);
  });

  it('should save options in class using helpFunction', () => {
    class SomeEntity {}
    const example = ['getAll', 'deleteRelationship'];
    const apiOptions: DecoratorOptions = {
      allowMethod: excludeMethod(example as any),
    };

    @JsonApi(SomeEntity, apiOptions)
    class SomeClass {}

    const data: DecoratorOptions = Reflect.getMetadata(
      JSON_API_DECORATOR_OPTIONS,
      SomeClass
    );
    expect(data).toEqual(apiOptions);
    expect(data.allowMethod).toEqual(
      Object.keys(Bindings).filter((k) => !example.includes(k))
    );
  });

  it('should save options in class and correctly set overrideRoute', () => {
    class SomeEntity {}
    const apiOptions: DecoratorOptions = {
      allowMethod: ['getAll', 'deleteRelationship'],
      overrideRoute: '123',
    };

    @JsonApi(SomeEntity, apiOptions)
    class SomeClass {}

    const data = Reflect.getMetadata(JSON_API_DECORATOR_OPTIONS, SomeClass);
    expect(data).toEqual(apiOptions);
  });
});
