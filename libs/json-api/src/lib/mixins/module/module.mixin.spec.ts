import { METHOD_METADATA, PATH_METADATA, PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';

import { transformMixin } from '../transform/transform.mixin';
import { serviceMixin } from '../service/service.mixin';
import { InjectService } from '../../decorators';
import { moduleMixin } from './module.mixin';
import { mixin } from '../../helpers';
import { Bindings } from '../../config/bindings';

jest.mock('../transform/transform.mixin');
jest.mock('../service/service.mixin');
const mockConnectionName = 'mockConnectionName';

describe('ModuleMixin', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should return mixin', () => {
    expect(moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName)).toBeDefined();
  });

  it('should keep controller', () => {
    const controller = class Controller {};
    const result = moduleMixin('/api/v1', controller, class Entity {}, mockConnectionName);

    expect(result.controller).toBe(controller);
  });

  it('should build transform', () => {
    const transformMock = class Transform {};
    // @ts-ignore
    transformMixin.mockReturnValueOnce(transformMock);

    const result = moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName);
    expect(result.providers).toContain(transformMock);
  });

  it('should build service', () => {
    const serviceMock = class Service {};
    // @ts-ignore
    serviceMixin.mockReturnValueOnce(serviceMock);
    const result = moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName);

    expect(result.providers).toContain(serviceMock);
  });

  it('should use global prefix', () => {
    const result = moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName);
    const { controller } = result;
    const metadata = Reflect.getMetadata(PATH_METADATA, controller);

    expect(metadata).toBe('/api/v1/entity');
  });

  it('should inject service', () => {
    // @ts-ignore
    serviceMixin.mockReturnValueOnce(mixin(class Service {}, 'Test'));
    const result = moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName);
    const { controller } = result;

    const depsMetadata = Reflect.getMetadata(PROPERTY_DEPS_METADATA, controller);
    expect(depsMetadata[0].type).toContain('Test-');
    expect(depsMetadata[0].key).toBe('serviceMixin');
  });

  it('should inject service to defined controller', () => {
    class Controller {
      @InjectService() protected testProp;
    }
    // @ts-ignore
    serviceMixin.mockReturnValueOnce(mixin(class Service {}, 'Test'));
    const result = moduleMixin('/api/v1', Controller, class Entity {}, mockConnectionName);
    const { controller } = result;

    const depsMetadata = Reflect.getMetadata(PROPERTY_DEPS_METADATA, controller);
    expect(depsMetadata.find(item => item.type.includes('Test-'))).toBeDefined();
    expect(depsMetadata.find(item => item.key === 'testProp')).toBeDefined();
  });

  it('should add request handling methods', () => {
    const { controller } = moduleMixin('/api/v1', undefined, class Entity {}, mockConnectionName);
    Object.values(Bindings).forEach(binding => {
      const { name, path, method } = binding;

      const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, name);
      const methodMeta = Reflect.getMetadata(METHOD_METADATA, descriptor.value);
      const methodPath = Reflect.getMetadata(PATH_METADATA, descriptor.value);

      expect(Object.values(RequestMethod)[methodMeta]).toBeDefined();
      expect(methodMeta).toEqual(method);
      if (path !== '') {
        expect(methodPath).toEqual(path);
      } else {
        expect(methodPath).toEqual('/');
      }
    });
  });
});
