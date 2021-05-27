import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { JsonApiTransform, ModuleConfig } from '../../types';
import { JSON_API_CONFIG } from '../../constants';
import { transformMixin } from './transform.mixin';


describe('TransformMixin', () => {
  const entityMock = class SomeEntityMock {};
  let repoMock;

  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const mixin = transformMixin(entityMock, mockConnectionName);
  let service: JsonApiTransform;
  let config: ModuleConfig;

  beforeEach(async () => {
    repoMock = {
      target: class SomeEntity {},
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      manager: {
        getRepository: jest.fn(),
        create: jest.fn()
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mixin,
        {
          provide: repoToken,
          useValue: repoMock,
        },
        {
          provide: JSON_API_CONFIG,
          useValue: {
            globalPrefix: 'api/version'
          }
        }
      ]
    }).compile();

    service = module.get<JsonApiTransform>(mixin);
    config = module.get<ModuleConfig>(JSON_API_CONFIG);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct relation link', () => {
    const result = service.getRelationshipLink('resource', '1', 'relation');
    expect(result).toBe('/api/version/resource/1/relationships/relation');
  });

  it('should return correct resource link', () => {
    const result = service.getResourceLink('resource', '1');
    expect(result).toBe('/api/version/resource/1');
  });

  it('should return correct direct link', () => {
    const result = service.getDirectLink('resource', '1', 'relation');
    expect(result).toBe('/api/version/resource/1/relation');
  });

  it('should use global prefix for links', () => {
    config.globalPrefix = 'test/prefix';
    const firstResult = service.getRelationshipLink('resource', '1', 'relation');
    const secondResult = service.getResourceLink('resource', '1');
    const thirdResult = service.getDirectLink('resource', '1', 'relation');

    expect(firstResult).toContain(config.globalPrefix);
    expect(secondResult).toContain(config.globalPrefix);
    expect(thirdResult).toContain(config.globalPrefix);
  });

  it('should transform data correctly', () => {
    repoMock.metadata = {
      name: 'resource-name',
      relations: [{
        propertyPath: 'firstRelation',
      }, {
        propertyPath: 'secondRelation',
      }],
    };

    class FirstRelation {
      public id = 12;
      public someValue = 'test';
    }
    class SecondRelation {
      public id = 20;
      public someValue = 'test';
    }
    class ResourceName {
      public id = 1;
      public name = 'john';
      public email = 'test@mail.com';
      public firstRelation = new FirstRelation();
      public secondRelation = new SecondRelation();
    }

    jest.spyOn(repoMock.manager, 'getRepository').mockImplementation(name => {
      return {
        ...repoMock,
        metadata: {
          ...repoMock.metadata,
          name,
        },
      };
    });

    const result = service.transformData(new ResourceName());
    expect(result).toEqual({
      'id': '1',
      'type': 'resource-name',
      'attributes': {
        'name': 'john',
        'email': 'test@mail.com'
      },
      'relationships': {
        'firstRelation': {
          'data': {
            'type': 'first-relation',
            'id': '12'
          },
          'links': {
            'self': '/api/version/resource-name/1/relationships/firstRelation',
            'related': '/api/version/resource-name/1/firstRelation'
          }
        },
        'secondRelation': {
          'data': {
            'type': 'second-relation',
            'id': '20'
          },
          'links': {
            'self': '/api/version/resource-name/1/relationships/secondRelation',
            'related': '/api/version/resource-name/1/secondRelation'
          }
        }
      },
      'links': {
        'self': '/api/version/resource-name/1'
      }
    });
  });

  it('should add links for relation if there is no data', () => {
    repoMock.metadata = {
      name: 'resource-name',
      relations: [{
        propertyPath: 'firstRelation',
      }, {
        propertyPath: 'secondRelation',
      }, {
        propertyPath: 'withoutData',
      }],
    };

    class FirstRelation {
      public id = 12;
      public someValue = 'test';
    }
    class SecondRelation {
      public id = 20;
      public someValue = 'test';
    }
    class ResourceName {
      public id = 1;
      public name = 'john';
      public email = 'test@mail.com';
      public firstRelation = new FirstRelation();
      public secondRelation = new SecondRelation();
    }

    jest.spyOn(repoMock.manager, 'getRepository').mockImplementation(name => {
      return {
        ...repoMock,
        metadata: {
          ...repoMock.metadata,
          name,
        },
      };
    });

    const result = service.transformData(new ResourceName());
    expect(result.relationships.withoutData).toEqual({
      links: {
        'self': '/api/version/resource-name/1/relationships/withoutData',
        'related': '/api/version/resource-name/1/withoutData'
      }
    });
  });

  it('should transform include correctly', () => {
    repoMock.metadata = {
      name: 'resource-name',
      relations: [{
        propertyPath: 'firstRelation',
      }, {
        propertyPath: 'secondRelation',
      }],
    };

    class FirstRelation {
      public id = 12;
      public someValue = 'test';
    }
    class SecondRelation {
      public id = 20;
      public someValue = 'test';
    }
    class ResourceName {
      public id = 1;
      public name = 'john';
      public email = 'test@mail.com';
      public firstRelation = new FirstRelation();
      public secondRelation = new SecondRelation();
    }

    jest.spyOn(repoMock.manager, 'getRepository').mockImplementation(name => {
      const newRepo = {
        ...repoMock,
        metadata: {
          ...repoMock.metadata,
          name,
        },
      };

      if (name !== 'ResourceName') {
        newRepo.metadata.relations = [{
          propertyPath: 'anotherRelation',
        }];
      }

      return newRepo;
    });

    const result = service.transformInclude(new ResourceName());
    expect(result).toEqual([
      {
        'id': '12',
        'type': 'first-relation',
        'attributes': {
          'someValue': 'test'
        },
        'relationships': {
          'anotherRelation': {
            'links': {
              'self': '/api/version/first-relation/12/relationships/anotherRelation',
              'related': '/api/version/first-relation/12/anotherRelation'
            }
          }
        },
        'links': {
          'self': '/api/version/first-relation/12'
        }
      },
      {
        'id': '20',
        'type': 'second-relation',
        'attributes': {
          'someValue': 'test'
        },
        'relationships': {
          'anotherRelation': {
            'links': {
              'self': '/api/version/second-relation/20/relationships/anotherRelation',
              'related': '/api/version/second-relation/20/anotherRelation'
            }
          }
        },
        'links': {
          'self': '/api/version/second-relation/20'
        }
      }
    ]);
  });
});
