import {
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { getProviderName } from '../../helper';
import 'reflect-metadata';

import { InjectService } from './inject-service.decorator';
import { TYPEORM_SERVICE } from '../../constants';

describe('InjectServiceDecorator', () => {
  it('should save property key', () => {
    class SomeClass {
      @InjectService() protected property: any;
      constructor(@InjectService() protected test: any) {}
    }

    const properties = Reflect.getMetadata(PROPERTY_DEPS_METADATA, SomeClass);
    const properties1 = Reflect.getMetadata(
      SELF_DECLARED_DEPS_METADATA,
      SomeClass
    );
    expect(
      properties.find((item: any) => item.type === TYPEORM_SERVICE)
    ).toBeDefined();

    expect(
      properties1.find((item: any) => item.param === TYPEORM_SERVICE)
    ).toBeDefined();
  });
});
