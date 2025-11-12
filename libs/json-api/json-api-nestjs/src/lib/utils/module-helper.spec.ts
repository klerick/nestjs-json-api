import { ParseIntPipe } from '@nestjs/common';

import {
  DEFAULT_CONNECTION_NAME,
  JSON_API_DECORATOR_ENTITY,
} from '../constants';
import { prepareConfig, getController } from './module-helper';
import { Params } from '../types';

describe('module-helper', () => {
  describe('getController', () => {
    beforeAll(() => {
      Reflect.defineMetadata = vi.fn();
      Reflect.getMetadata = vi.fn((key, target) => {
        if (key === JSON_API_DECORATOR_ENTITY && (target as any).entity) {
          return (target as any).entity;
        }
        return undefined;
      });
    });

    it('should return the controller that matches the entity metadata', () => {
      const entity = class Entity1 {};
      const controllers = [
        { entity },
        { entity: 'Entity2' },
        { entity: 'Entity3' },
      ] as any;

      const result = getController(entity, controllers);

      expect(result).toEqual(controllers[0]);
    });

    it('should return undefined if no controllers match the entity metadata', () => {
      const entity = class UnknownEntity {};
      const controllers = [{ entity: 'Entity1' }, { entity: 'Entity2' }] as any;

      const result = getController(entity, controllers);

      expect(result).toBeUndefined();
    });

    it('should return undefined if controllers list is empty', () => {
      const entity = class Entity1 {};
      const controllers: any[] = [];

      const result = getController(entity, controllers);

      expect(result).toBeUndefined();
    });

    it('should handle malformed input gracefully', () => {
      const entity = class Entity1 {};
      const controllers = [null, undefined, { entity: 'Entity2' }, true] as any;

      const result = getController(entity, controllers);

      expect(result).toBeUndefined();
    });
  });

  describe('prepareConfig', () => {
    it('should return default values when no options are provided', () => {
      const moduleParams: Params<NonNullable<unknown>> = {
        options: undefined,
        connectionName: undefined,
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      };

      const result = prepareConfig(moduleParams);

      expect(result).toEqual({
        connectionName: DEFAULT_CONNECTION_NAME,
        imports: [],
        providers: [],
        controllers: [],
        entities: [],
        hooks: {
          afterCreateController: result.hooks.afterCreateController,
        },
        options: {
          operationUrl: undefined,
          requiredSelectField: false,
          debug: false,
          allowSetId: false,
          pipeForId: ParseIntPipe,
        },
      });
    });

    it('should override default connectionName if provided', () => {
      const moduleParams = {
        connectionName: 'custom_connection',
        options: {},
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      };

      const result = prepareConfig(moduleParams);

      expect(result.connectionName).toBe('custom_connection');
    });

    it('should merge provided options with defaults', () => {
      const moduleParams = {
        options: { debug: true, operationUrl: 'http://example.com' },
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      };

      const result = prepareConfig(moduleParams);

      expect(result.options).toEqual({
        allowSetId: false,
        operationUrl: 'http://example.com',
        requiredSelectField: false,
        debug: true,
        pipeForId: ParseIntPipe,
      });
    });

    it('should ensure requiredSelectField is cast to boolean', () => {
      const moduleParams = {
        options: { requiredSelectField: true },
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      } as Params;

      const result = prepareConfig(moduleParams);
      expect(result.options['requiredSelectField']).toBe(true);
    });

    it('should default pipeForId to ParseIntPipe if not provided in options', () => {
      const moduleParams = {
        options: {},
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      };

      const result = prepareConfig(moduleParams);

      expect(result.options.pipeForId).toBe(ParseIntPipe);
    });

    it('should use provided pipeForId if specified in options', () => {
      class CustomPipe {}

      const moduleParams = {
        options: { pipeForId: CustomPipe },
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      };

      const result = prepareConfig(moduleParams as any);

      expect(result.options.pipeForId).toBe(CustomPipe);
    });

    it('should return provided entities if specified', () => {
      const entities = ['Entity1', 'Entity2'] as any;
      const moduleParams: Params<NonNullable<unknown>> = {
        entities,
        imports: undefined,
        providers: undefined,
        controllers: undefined,
      };

      const result = prepareConfig(moduleParams);

      expect(result.entities).toBe(entities);
      expect(result).toHaveProperty('options');
      expect(result.options).toEqual({
        allowSetId: false,
        operationUrl: undefined,
        requiredSelectField: false,
        debug: false,
        pipeForId: ParseIntPipe,
      });
    });

    it('should be return module option as is', () => {
      const moduleParams = {
        options: { customOptions: 'string' },
        imports: undefined,
        providers: undefined,
        controllers: undefined,
        entities: [] as any,
      } as Params<{ customOptions: string }>;

      const result = prepareConfig(moduleParams);
      expect(result.options['customOptions']).toBe('string');
    });
  });
});
