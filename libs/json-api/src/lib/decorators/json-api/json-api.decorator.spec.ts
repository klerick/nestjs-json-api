import 'reflect-metadata';

import { JSON_API_ENTITY } from '../../constants/reflection';
import { JsonApi } from './json-api.decorator';


describe('InjectServiceDecorator', () => {
  it('should save entity in class', () => {
    const testedEntity = class SomeEntity {};
    @JsonApi(testedEntity)
    class SomeClass {}

    const data = Reflect.getMetadata(JSON_API_ENTITY, SomeClass);
    expect(data).toBe(testedEntity);
  });
});
