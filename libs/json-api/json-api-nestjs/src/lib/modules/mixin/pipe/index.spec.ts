import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import { PipeTransform } from '@nestjs/common/interfaces';

import { factoryMixin } from './index';
import { ModuleMixinOptions } from '../../../types';

describe('factoryMixin', () => {
  class TestEntity {}

  class TestPipe implements PipeTransform {
    name = 'TestPipe';

    transform(value: any) {
      return value;
    }
  }

  function isInjectable(cls: any): boolean {
    return Reflect.getMetadata(INJECTABLE_WATERMARK, cls);
  }

  it('should return a pipe class with a new name', () => {
    const pipeClass = factoryMixin(
      TestEntity as ModuleMixinOptions['entity'],
      TestPipe
    );
    expect(pipeClass.name).toBe('TestEntityTestPipe');
  });

  it('should return a pipe class that is Injectable', () => {
    const pipeClass = factoryMixin(
      TestEntity as ModuleMixinOptions['entity'],
      TestPipe
    );
    expect(isInjectable(pipeClass)).toBe(true);
  });

  it('should preserve the behavior of the original pipe', () => {
    const pipeClass = factoryMixin(
      TestEntity as ModuleMixinOptions['entity'],
      TestPipe
    );
    const instance = new pipeClass();
    expect(instance.transform('testValue', {} as any)).toBe('testValue');
  });
});
