import { DynamicModule, ParseIntPipe } from '@nestjs/common';

import { MicroOrmModule, TypeOrmModule, TypeOrmParam } from '../modules';
import { ConfigParam, RequiredFromPartial } from '../types';
import { prepareConfig, createMixinModule } from './helper';
import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_CONTROLLER_POSTFIX,
} from '../constants';
import { JsonBaseController } from '../modules/mixin/controller/json-base.controller';
import { JsonApi } from '../modules/mixin/decorators';
import { getProviderName } from '../modules/mixin/helper';

class A {}
describe('Helper tests', () => {
  describe('prepareConfig', () => {
    it('should return default config when type is undefined', () => {
      const result = prepareConfig({
        entities: [A],
        options: { debug: false, requiredSelectField: false },
      });

      expect(Array.isArray(result.imports)).toBe(true);
      expect(Array.isArray(result.controllers)).toBe(true);
      expect(Array.isArray(result.providers)).toBe(true);
      expect(result.type).toBe(TypeOrmModule);
      expect(result.options.debug).toBe(false);
      expect(result.options.requiredSelectField).toBe(false);
      expect(result.connectionName).toBe(DEFAULT_CONNECTION_NAME);
    });

    it('should return TypeOrm config when type is TypeOrmModule', () => {
      const result = prepareConfig({
        entities: [A],
        type: TypeOrmModule,
        options: {
          debug: true,
          requiredSelectField: true,
          useSoftDelete: true,
        },
      });

      expect(result.type).toBe(TypeOrmModule);
      expect(result.options.debug).toBe(true);
      expect(
        (result.options as RequiredFromPartial<ConfigParam & TypeOrmParam>)
          .useSoftDelete
      ).toBe(true);
    });

    it('should return MicroOrm config when type is MicroOrmModule', () => {
      const result = prepareConfig({
        entities: [A],
        type: MicroOrmModule,
        options: { debug: true, requiredSelectField: true },
      });

      expect(result.type).toBe(MicroOrmModule);
      expect(result.options.debug).toBe(true);
      expect(result.options.requiredSelectField).toBe(true);

      // @ts-expect-error eed check run time
      expect((result.options as ConfigParam).useSoftDelete).toBeUndefined();
    });

    it('should use default values for pipeForId, operationUrl, and overrideRoute when not provided', () => {
      const result = prepareConfig({
        entities: [A],
        options: {},
      });

      expect(result.options.pipeForId).toBe(ParseIntPipe);
      expect(result.options.operationUrl).toBe(false);
      expect(result.options.overrideRoute).toBe(false);
    });
  });

  describe('createMixinModule', () => {
    it('should create a MixinModule with the correct controller matching the entity', () => {
      class TestEntity {}
      @JsonApi(TestEntity)
      class TestController extends JsonBaseController<any> {}
      const commonOrmModule = {} as DynamicModule;
      const resultOptions = prepareConfig({
        entities: [TestEntity],
        controllers: [TestController],
        connectionName: DEFAULT_CONNECTION_NAME,
        type: TypeOrmModule,
        options: {
          debug: true,
          requiredSelectField: true,
          useSoftDelete: true,
        },
      });

      const result = createMixinModule(
        TestEntity,
        resultOptions,
        commonOrmModule
      );

      expect(result).toHaveProperty('controllers', [TestController]);
      expect(result).toHaveProperty('providers');
      expect(result.imports?.includes(commonOrmModule)).toBe(true);
    });

    it('should use undefined as controller if none match the entity', () => {
      class TestEntity {}
      const commonOrmModule = {} as DynamicModule;
      const resultOptions = prepareConfig({
        entities: [TestEntity],
        controllers: [],
        connectionName: 'test_connection',
        options: { debug: false },
        imports: [],
      });

      const result = createMixinModule(
        TestEntity,
        resultOptions,
        commonOrmModule
      );

      const controller = (result.controllers || []).at(0);
      expect(controller?.name).toBe(
        getProviderName(TestEntity, JSON_API_CONTROLLER_POSTFIX)
      );
    });

    it('should correctly construct the MixinModule using given ResultModuleOptions', () => {
      class AnotherEntity {}
      class SharedModule {}
      const commonOrmModule = {} as DynamicModule;
      const importTest = { module: SharedModule };

      const resultOptions = prepareConfig({
        entities: [AnotherEntity],
        controllers: [],
        connectionName: 'default_connection',
        options: { debug: true, useSoftDelete: true },
        imports: [importTest],
      });

      const result = createMixinModule(
        AnotherEntity,
        resultOptions,
        commonOrmModule
      );
      expect(result.imports?.at(1)).toEqual(importTest);
    });
  });
});
