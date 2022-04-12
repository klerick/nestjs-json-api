import {
  MethodName,
  PARAMS_RELATION_ID,
  PARAMS_RELATION_NAME,
  PARAMS_RESOURCE_ID,
  SwaggerConfig,
} from '../../../index';

import { SwaggerService } from './swagger.service';

describe('SwaggerService', () => {
  beforeEach(() => {
    SwaggerService.clear();
  });

  it('should add entities in the list', async () => {
    const entitiesList = [
      class FirstEntity {},
      class SecondEntity {},
      class ThirdEntity {},
    ];

    entitiesList.forEach((item) => {
      SwaggerService.addEntity(item);
    });

    const result = SwaggerService.getEntities();
    expect(result).toHaveLength(3);
    entitiesList.forEach((item) => {
      expect(result.includes(item)).toBeTruthy();
    });
  });

  it('should store a swagger config', () => {
    const config: SwaggerConfig = {
      tokenUrl: 'someUrl',
      version: '1.0.0',
      apiPrefix: 'swagger',
      apiHost: '0.0.0.0',
    };

    SwaggerService.setConfig(config);
    expect(SwaggerService.getConfig()).toEqual(config);
  });

  it('should prepare tag for relation', () => {
    const methods: MethodName[] = [
      'deleteRelationship',
      'getRelationship',
      'patchRelationship',
      'postRelationship',
    ];

    methods.forEach((method) => {
      const result = SwaggerService.prepareTag('TestEntity', method);

      expect(result.name).toBe('TestEntity / Relationships');
      expect(result.description).toBeDefined();
    });
  });

  it('should prepare tag for direct', () => {
    const methods: MethodName[] = ['getDirectAll', 'getDirectOne'];

    methods.forEach((method) => {
      const result = SwaggerService.prepareTag('TestEntity', method);

      expect(result.name).toBe('TestEntity / Direct');
      expect(result.description).toBeDefined();
    });
  });

  it('should prepare tag for resource', () => {
    const methods: MethodName[] = ['postOne', 'patchOne', 'getOne', 'getAll'];

    methods.forEach((method) => {
      const result = SwaggerService.prepareTag('TestEntity', method);

      expect(result.name).toBe('TestEntity');
      expect(result.description).toBeDefined();
    });
  });

  it('should change parameters to swagger', () => {
    const result = SwaggerService.preparePath(
      `path/:${PARAMS_RESOURCE_ID}/second/:${PARAMS_RELATION_NAME}/:${PARAMS_RELATION_ID}`
    );
    expect(result).toBe(
      `path/{${PARAMS_RESOURCE_ID}}/second/{${PARAMS_RELATION_NAME}}/{${PARAMS_RELATION_ID}}`
    );
  });

  it('should prepare correct get method', () => {
    const methods: MethodName[] = [
      'getRelationship',
      'getDirectAll',
      'getDirectOne',
      'getAll',
      'getOne',
    ];

    methods.forEach((method) => {
      expect(SwaggerService.prepareMethodName(method)).toBe('get');
    });
  });

  it('should prepare correct post method', () => {
    const methods: MethodName[] = ['postRelationship', 'postOne'];

    methods.forEach((method) => {
      expect(SwaggerService.prepareMethodName(method)).toBe('post');
    });
  });

  it('should prepare correct patch method', () => {
    const methods: MethodName[] = ['patchRelationship', 'patchOne'];

    methods.forEach((method) => {
      expect(SwaggerService.prepareMethodName(method)).toBe('patch');
    });
  });

  it('should prepare correct delete method', () => {
    const methods: MethodName[] = ['deleteRelationship', 'deleteOne'];

    methods.forEach((method) => {
      expect(SwaggerService.prepareMethodName(method)).toBe('delete');
    });
  });

  it('should add route config', () => {
    const entityMock = class SomeEntity {};
    const method: MethodName = 'getOne';
    const path = 'entity-mock/:id';

    SwaggerService.addRouteConfig(entityMock, path, method);
    const result = SwaggerService.prepareDocument();

    expect(result.paths['entity-mock/{id}']).toBeDefined();
  });

  it('should define path parameters', () => {
    const entityMock = class SomeEntity {};
    const method: MethodName = 'getOne';
    const path = 'entity-mock/:id';

    SwaggerService.addRouteConfig(entityMock, path, method);
    const result = SwaggerService.prepareDocument();

    expect(result.paths['entity-mock/{id}'].get.parameters).toEqual([
      {
        $ref: '#/resources/SomeEntity/parameters/include',
      },
      {
        $ref: '#/resources/SomeEntity/parameters/id',
      },
    ]);
  });

  it('should define request schema', () => {
    const entityMock = class SomeEntity {};
    const method: MethodName = 'patchOne';
    const path = 'entity-mock/:id';

    SwaggerService.addRouteConfig(entityMock, path, method);
    const result = SwaggerService.prepareDocument();

    expect(result.paths['entity-mock/{id}'].patch.requestBody).toEqual({
      $ref: '#/resources/SomeEntity/requests/patchOne',
    });
  });

  it('should use tags for paths', () => {
    const entityMock = class SomeEntity {};
    const method: MethodName = 'patchRelationship';
    const path = 'entity-mock/:id';

    SwaggerService.addRouteConfig(entityMock, path, method);
    const result = SwaggerService.prepareDocument();

    expect(result.paths['entity-mock/{id}'].patch.tags[0]).toEqual(
      'SomeEntity / Relationships'
    );
  });

  it('should create server block if config exists', () => {
    let result = SwaggerService.prepareDocument();

    expect(result.servers).not.toBeDefined();

    SwaggerService.setConfig({
      apiPrefix: 'example',
      apiHost: 'http://0.0.0.0',
    });
    result = SwaggerService.prepareDocument();

    expect(result.servers[0]).toEqual({
      url: 'http://0.0.0.0/example',
    });
  });

  it('should create auth block if config exists', () => {
    let result = SwaggerService.prepareDocument();

    expect(result.components.securitySchemes).not.toBeDefined();

    SwaggerService.setConfig({
      authConfig: {
        clientCredentials: {
          tokenUrl: 'http://localhost:3000',
          scopes: ['test']
        }
      }
    });
    result = SwaggerService.prepareDocument();

    expect(result.components.securitySchemes).toEqual({
      authorisation: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'http://localhost:3000',
            scopes: {
              'test': 'test',
            },
          },
        },
      },
    });
  });

  it('should use version if config exists', () => {
    let result = SwaggerService.prepareDocument();

    expect(result.info.version).not.toBeDefined();

    SwaggerService.setConfig({ version: '1.0.0' });
    result = SwaggerService.prepareDocument();

    expect(result.info.version).toBe('1.0.0');
  });

  it('should create custom route', () => {
    const customRoute = {
      path: ':id/test',
      method: 0,
      response: {},
      operation: { responses: { 200: { description: '200 desc' } } },
      entityName: 'Test',
      methodName: 'methodMock' as MethodName,
    };
    SwaggerService.addCustomRouteConfig(customRoute);
    const result = SwaggerService.prepareDocument();

    const expectedRoute = {
      '/test/{id}/test': {
        get: {
          responses: {
            '200': {
              description: '200 desc',
            },
          },
          tags: ['Test'],
        },
      },
    };

    expect(result.paths).toStrictEqual(expectedRoute);
  });
});
