import {
  CONTROLLER_WATERMARK,
  INTERCEPTORS_METADATA,
  PATH_METADATA,
  PROPERTY_DEPS_METADATA,
} from '@nestjs/common/constants';
import { createController } from './create-controller';
import { JsonBaseController } from '../controllers/json-base.controller';
import {
  JSON_API_CONTROLLER_POSTFIX,
  ORM_SERVICE,
  ORM_SERVICE_PROPS,
} from '../../../constants';
import { InjectService, JsonApi } from '../decorators';
import { ErrorInterceptors, LogTimeInterceptors } from '../interceptors';

class Users {}

describe('createController', () => {
  it('Should be error', () => {
    class TestController {}
    expect.assertions(2);
    try {
      createController(Users, TestController);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toBe(
        'Controller "TestController" should be inherited of "JsonBaseController"'
      );
    }
  });

  it('Should be correct name controller', () => {
    class TestController extends JsonBaseController<Users> {}
    const result = createController(Users);
    const result1 = createController(Users, TestController);
    expect(result.name).toBe('Users' + JSON_API_CONTROLLER_POSTFIX);
    expect(result1.name).toBe('TestController');
  });

  it('Should be correct path for controller', () => {
    const overrideRoute = 'override-route';
    class TestController extends JsonBaseController<Users> {}

    @JsonApi(Users, {
      overrideRoute,
    })
    class TestController2 extends JsonBaseController<Users> {}
    const result = createController(Users);
    const result2 = createController(Users, TestController);
    const result3 = createController(Users, TestController2);

    expect(Reflect.getMetadata(CONTROLLER_WATERMARK, result)).toBe(true);
    expect(Reflect.getMetadata(PATH_METADATA, result)).toBe('users');

    expect(Reflect.getMetadata(CONTROLLER_WATERMARK, result2)).toBe(true);
    expect(Reflect.getMetadata(PATH_METADATA, result2)).toBe('users');

    expect(Reflect.getMetadata(CONTROLLER_WATERMARK, result3)).toBe(true);
    expect(Reflect.getMetadata(PATH_METADATA, result3)).toBe(overrideRoute);
  });

  it('Check inject typeorm, service', () => {
    class TestController extends JsonBaseController<Users> {
      @InjectService() private tmp: any;
    }

    const result = createController(Users);
    const result1 = createController(Users, TestController);

    const check = Reflect.getMetadata(
      PROPERTY_DEPS_METADATA,
      result.prototype.constructor
    );
    const check1 = Reflect.getMetadata(
      PROPERTY_DEPS_METADATA,
      result1.prototype.constructor
    );

    const intecept = Reflect.getMetadata(
      INTERCEPTORS_METADATA,
      result1.prototype.constructor
    );
    expect(intecept).not.toBe(undefined);
    expect(intecept[0]).toEqual(LogTimeInterceptors);
    expect(intecept[1]).toEqual(ErrorInterceptors);
    expect(check[0].key).toBe(ORM_SERVICE_PROPS);
    expect(check[0].type).toEqual(ORM_SERVICE);

    expect(check1[0].key).toBe('tmp');
    expect(check1[0].type).toEqual(ORM_SERVICE);

    expect(check1[1].key).toBe(ORM_SERVICE_PROPS);
    expect(check1[1].type).toEqual(ORM_SERVICE);
  });
});
