import {
  PROPERTY_DEPS_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import 'reflect-metadata';

import { InjectService } from './inject-service.decorator';
import { ORM_SERVICE } from '../../../../constants';

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
      properties.find((item: any) => item.type === ORM_SERVICE)
    ).toBeDefined();

    expect(
      properties1.find((item: any) => item.param === ORM_SERVICE)
    ).toBeDefined();
  });
});
