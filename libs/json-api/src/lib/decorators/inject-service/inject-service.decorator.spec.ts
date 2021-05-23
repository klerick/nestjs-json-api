import { PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';
import { getServiceToken } from '../../../index';
import 'reflect-metadata';

import { InjectService } from './inject-service.decorator';

describe('InjectServiceDecorator', () => {
  it('should save property key', () => {
    class SomeClass { @InjectService() protected property; }

    const properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, SomeClass);
    const serviceToken = getServiceToken(SomeClass);

    expect(properties.find(item => item.type === serviceToken)).toBeDefined();
  });
});
