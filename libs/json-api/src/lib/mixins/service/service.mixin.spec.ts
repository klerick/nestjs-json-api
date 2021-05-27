import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { serviceMixin } from './service.mixin';
import {
  RequestRelationshipsData,
  RequestResourceData,
  JsonApiService,
  ServiceOptions,
  QueryField,
} from '../../types';


describe('ServiceMixin', () => {
  const entityMock = class SomeEntityMock {};
  let relationBuilderMock;
  let deleteBuilderMock;
  let queryBuilderMock;
  let repoMock;
  const transformMock = {
    getRelationshipLink: jest.fn(),
    transformInclude: jest.fn(),
    transformData: jest.fn(),
  } as any;

  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const mixin = serviceMixin(entityMock, transformMock, mockConnectionName);
  let service: JsonApiService;

  beforeEach(async () => {
    relationBuilderMock = {
      addAndRemove: jest.fn(),
      loadMany: jest.fn(),
      remove: jest.fn(),
      set: jest.fn(),
      add: jest.fn(),
      of: jest.fn().mockReturnThis(),
    };

    deleteBuilderMock = {
      where: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      relation: jest.fn().mockReturnValue(relationBuilderMock),
      delete: jest.fn().mockReturnValue(deleteBuilderMock),
      getCount: jest.fn(),
      orderBy: jest.fn(),
      where:  jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      alias: 'test',
    };

    repoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      target: class SomeEntity {},
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      manager: {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
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
          provide: transformMock,
          useValue: transformMock,
        },
      ]
    }).compile();

    service = module.get<JsonApiService>(mixin);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Delete relationships:', () => {
    it('should throw an error if relationship not found', async () => {
      const optionsMock = {
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName'
      };
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue(undefined);
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();

      let error;
      try {
        await service.deleteRelationship(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(whereMock.mock.calls[0][0]).toEqual({
        id: 1
      });
      expect(getOneMock).toBeCalled();
    });

    it('should delete many-to-many relations',  async () => {
      const optionsMock = {
        body: [{
          type: 'type',
          id: '10',
        }, {
          type: 'type',
          id: '20'
        }],
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relation',
        }]
      };
      const removeRelationMock  = jest.spyOn(relationBuilderMock, 'remove');
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue({});

      await service.deleteRelationship(optionsMock);

      expect(removeRelationMock.mock.calls[0][0]).toEqual(['10', '20']);
      expect(removeRelationMock).toBeCalled();
      expect(getOneMock).toBeCalled();
    });

    it('should delete one-to-one relation',  async () => {
      const optionsMock = {
        body: {
          type: 'type',
          id: '10',
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relation',
        }]
      };
      const setRelationMock  = jest.spyOn(relationBuilderMock, 'set');
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue({});

      await service.deleteRelationship(optionsMock);

      expect(setRelationMock.mock.calls[0][0]).toBe(null);
      expect(setRelationMock).toBeCalled();
      expect(getOneMock).toBeCalled();
    });
  });

  describe('Delete one:', () => {
    it('should throw an error if entity does not exist', async () => {
      const optionsMock = {
        route: {
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'someName',
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue(undefined);

      let error;
      try {
        await service.deleteOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(whereMock.mock.calls[0][0]).toEqual({
        id: 1
      });
      expect(getOneMock).toBeCalled();
    });

    it('should delete successful on correct call', async () => {
      const optionsMock = {
        route: {
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'someName',
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue({});

      const deleteWhereMock = jest.spyOn(deleteBuilderMock, 'where');
      const deleteMock = jest.spyOn(deleteBuilderMock, 'execute');

      await service.deleteOne(optionsMock);

      expect(deleteWhereMock.mock.calls[0][1]).toEqual({ id: 1 });
      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(deleteMock).toBeCalled();
      expect(getOneMock).toBeCalled();
    });
  });

  describe('Post relationship:', () => {
    it('should return errors if relationship does not exist', async () => {
      const optionsMock = {
        body: {
          type: 'type',
          id: '1'
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue(undefined);

      let error;
      try {
        await service.postRelationship(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(getOneMock).toBeCalled();
    });

    it('should create many-to-many relation', async () => {
      const optionsMock = {
        body: [{
          type: 'type',
          id: '10'
        }, {
          type: 'type',
          id: '20',
        }],
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relation',
        }]
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue({ });
      const createRelationMock = jest.spyOn(relationBuilderMock, 'add');

      await service.postRelationship(optionsMock);

      expect(createRelationMock.mock.calls[0][0]).toEqual(['10', '20']);
      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(getOneMock).toBeCalled();
    });

    it('should create one-to-one relation', async () => {
      const optionsMock = {
        body: {
          type: 'type',
          id: '10'
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relation',
        }]
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue({ });
      const createRelationMock = jest.spyOn(relationBuilderMock, 'set');

      await service.postRelationship(optionsMock);

      expect(createRelationMock.mock.calls[0][0]).toEqual('10');
      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(getOneMock).toBeCalled();
    });
  });

  describe('Post one:', () => {
    it('should create new resource successful', async () => {
      const optionsMock = {
        body: {
          relationships: {},
          attributes: {}
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestResourceData>;
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({ attributes: {}});
      const saveCallMock = jest.spyOn(repoMock, 'save')
        .mockReturnValue('some-data');

      const result = await service.postOne(optionsMock);

      expect(saveCallMock).toBeCalled();
      expect(transformDataMock.mock.calls[0][0]).toBe('some-data');
      expect(result).toEqual({
        data: {
          attributes: {}
        }
      });
    });

    it('should create with many-to-many relations', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: [{
                type: 'some-type',
                id: '1',
              },
              {
                type: 'some-type',
                id: '2',
              }]
            }
          },
          attributes: {}
        },
        route: {
          relName: 'relation-test',
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      jest.spyOn(repoMock.manager, 'create').mockReturnValue({});
      const getRepository = jest.spyOn(repoMock.manager, 'getRepository')
        .mockReturnValue(repoMock);
      const findMock = jest.spyOn(repoMock,  'find')
        .mockReturnValue([]);

      await service.postOne(optionsMock);

      expect(getRepository).toBeCalledWith(repoMock.metadata.relations[0].inverseEntityMetadata.target);
      expect((findMock as any).mock.calls[0][0].id._value).toEqual(['1', '2']);
    });

    it('should throw an error if many-to-many not found', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: [{
                type: 'some-type',
                id: '1',
              },
                {
                  type: 'some-type',
                  id: '2',
                }]
            }
          },
          attributes: {}
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      jest.spyOn(repoMock.manager, 'getRepository').mockReturnValue(repoMock);
      jest.spyOn(repoMock.manager, 'create').mockReturnValue({});
      const findMock = jest.spyOn(repoMock,  'find')
        .mockReturnValue(undefined);

      let error: HttpException;
      try {
        await service.postOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(404);
      expect(findMock).toBeCalled();
    });

    it('should create with one-to-one relations', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: {
                type: 'some-type',
                id: '1',
              },
            }
          },
          attributes: {}
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      jest.spyOn(repoMock.manager, 'create').mockReturnValue({});
      const getRepository = jest.spyOn(repoMock.manager, 'getRepository')
        .mockReturnValue(repoMock);
      const findOneMock = jest.spyOn(repoMock,  'findOne')
        .mockReturnValue({});

      await service.postOne(optionsMock);

      expect(getRepository).toBeCalledWith(repoMock.metadata.relations[0].inverseEntityMetadata.target);
      expect((findOneMock as any).mock.calls[0][0].id._type).toEqual('equal');
      expect((findOneMock as any).mock.calls[0][0].id._value).toEqual('1');
    });

    it('should throw with one-to-one relations', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: {
                type: 'some-type',
                id: '1',
              },
            }
          },
          attributes: {}
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      jest.spyOn(repoMock.manager, 'create').mockReturnValue({});
      jest.spyOn(repoMock.manager, 'getRepository')
        .mockReturnValue(repoMock);
      const findOneMock = jest.spyOn(repoMock,  'findOne')
        .mockReturnValue(undefined);

      let error: HttpException;
      try {
        await service.postOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(404);
      expect(findOneMock).toBeCalled();
    });
  });

  describe('Patch relationship:', () => {
    it('should return errors if relationship does not exist', async () => {
      const optionsMock = {
        body: {
          type: 'type',
          id: '1'
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
      };
      const whereMock = jest.spyOn(queryBuilderMock, 'where')
        .mockReturnThis();
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockResolvedValue(undefined);

      let error;
      try {
        await service.patchRelationship(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(getOneMock).toBeCalled();
    });

    it('should update many-to-many relation', async () => {
      const optionsMock = {
        body: [{
          type: 'type',
          id: '10'
        }, {
          type: 'type',
          id: '20',
        }],
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relation',
        }]
      };
      jest.spyOn(queryBuilderMock, 'getOne').mockResolvedValue({});
      const relationMock = jest.spyOn(queryBuilderMock, 'relation');
      const loadManyMock = jest.spyOn(relationBuilderMock, 'loadMany')
        .mockResolvedValue([{id: '101'}, {id: '102'}]);
      const addAndRemoveMock = jest.spyOn(relationBuilderMock, 'addAndRemove');

      await service.patchRelationship(optionsMock);

      expect(relationMock).toBeCalledWith('relation');
      expect(loadManyMock).toBeCalled();
      expect(addAndRemoveMock.mock.calls[0][1]).toEqual(['101', '102']);
      expect(addAndRemoveMock.mock.calls[0][0]).toEqual(['10', '20']);
    });

    it('should update one-to-one relation', async () => {
      const optionsMock = {
        body: {
          type: 'type',
          id: '10'
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relation',
        }]
      };
      jest.spyOn(queryBuilderMock, 'getOne').mockResolvedValue({});
      const relationMock = jest.spyOn(queryBuilderMock, 'relation');
      const setMock = jest.spyOn(relationBuilderMock, 'set');

      await service.patchRelationship(optionsMock);

      expect(relationMock).toBeCalledWith('relation');
      expect(setMock.mock.calls[0][0]).toEqual('10');
    });

    it('should nul relationships if body is null', async () => {
      const optionsMock = {
        body: null,
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<RequestRelationshipsData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relation',
        }]
      };
      jest.spyOn(queryBuilderMock, 'getOne').mockResolvedValue({});
      const relationMock = jest.spyOn(queryBuilderMock, 'relation');
      const setMock = jest.spyOn(relationBuilderMock, 'set');

      await service.patchRelationship(optionsMock);

      expect(relationMock).toBeCalledWith('relation');
      expect(setMock.mock.calls[0][0]).toEqual(null);
    });
  });

  describe('Patch one:', () => {
    it('should update resource successful', async () => {
      const optionsMock = {
        body: {
          attributes: {}
        },
        route: {
          id: 1,
        }
      } as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'some-name',
      };
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({ attributes: {}});
      const findOneMock = jest.spyOn(repoMock, 'findOne')
        .mockResolvedValue({});
      const saveCallMock = jest.spyOn(repoMock, 'save')
        .mockResolvedValue('some-data');

      const result = await service.patchOne(optionsMock);

      expect(saveCallMock).toBeCalled();
      expect(findOneMock).toBeCalled();
      expect(transformDataMock.mock.calls[0][0]).toBe('some-data');
      expect(result).toEqual({
        data: {
          attributes: {}
        }
      });
    });

    it('should throw an error if entity does not exist', async () => {
      const optionsMock = {
        body: {
          attributes: {}
        },
        route: {
          id: 1,
        }
      } as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'some-name',
      };
      const findOneMock = jest.spyOn(repoMock, 'findOne')
        .mockResolvedValue(undefined);

      let error: HttpException;
      try {
        await service.patchOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(findOneMock).toBeCalled();
    });

    it('should update with many-to-many relations', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: [{
                type: 'some-type',
                id: '1',
              },
              {
                type: 'some-type',
                id: '2',
              }]
            }
          },
          attributes: {}
        },
        route: {
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'many-to-many',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      const findRelationMock = jest.fn();
      const getRepository = jest.spyOn(repoMock.manager, 'getRepository')
        .mockReturnValue({ find: findRelationMock });
      jest.spyOn(repoMock, 'findOne').mockResolvedValue({});

      await service.patchOne(optionsMock);

      expect((findRelationMock as any).mock.calls[0][0].id._value).toEqual(['1', '2']);
      expect(getRepository).toBeCalledWith(repoMock.metadata.relations[0].inverseEntityMetadata.target);
    });

    it('should update with one-to-one relations', async () => {
      const optionsMock = {
        body: {
          relationships: {
            relationTest: {
              data: {
                type: 'some-type',
                id: '1',
              }
            }
          },
          attributes: {}
        },
        route: {
          id: 1,
        }
      } as unknown as ServiceOptions<RequestResourceData>;
      repoMock.metadata = {
        name: 'someName',
        relations: [{
          relationType: 'one-to-one',
          propertyName: 'relationTest',
          inverseEntityMetadata: {
            target: class SomeMock {},
          }
        }]
      };
      const findOneRelationMock = jest.fn();
      const getRepository = jest.spyOn(repoMock.manager, 'getRepository')
        .mockReturnValue({ findOne: findOneRelationMock });
      jest.spyOn(repoMock, 'findOne').mockResolvedValue({});

      await service.patchOne(optionsMock);

      expect((findOneRelationMock as any).mock.calls[0][0].id._value).toEqual('1');
      expect(getRepository).toBeCalledWith(repoMock.metadata.relations[0].inverseEntityMetadata.target);
    });
  });

  describe('Get relationship:', () => {
    it('should get one to one relationship successful', async () => {
      const optionsMock = {
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
      };
      const entityMock = { relation: {} };
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({ attributes: {}});
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue(entityMock);

      const result = await service.getRelationship(optionsMock);

      expect(transformDataMock.mock.calls[0][0]).toBe(entityMock.relation);
      expect(getOneMock).toBeCalled();
    });

    it('should get many-to-many relationship successful', async () => {
      const optionsMock = {
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
      };
      const entityMock = { relation: [{}, {}] };
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({ attributes: [{}, {}]});
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue(entityMock);

      const result = await service.getRelationship(optionsMock);

      expect(transformDataMock.mock.calls[0][0]).toBe(entityMock.relation[0]);
      expect(transformDataMock).toBeCalledTimes(2);
      expect(result.data).toHaveLength(2);
      expect(getOneMock).toBeCalled();
    });

    it('should throw an error if entity does not exist', async () => {
      const optionsMock = {
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
      };

      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue(undefined);
      let error: HttpException;
      try {
        await service.getRelationship(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(getOneMock).toBeCalled();
      expect(error).toBeInstanceOf(NotFoundException);
    });
  });

  describe('Get one:', () => {
    it('should get one to one relationship successful', async () => {
      const optionsMock = {
        query: {
          include: [
            'first-relation',
            'second-relation'
          ],
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [{
          propertyPath: 'first-relation',
        }, {
          propertyPath: 'second-relation',
        }]
      };
      const includedMock = [{ attributes: { someAttribute: 'value' }}];
      const dataMock = { attributes: { someAttribute: 'value' }};

      const transformInclude = jest.spyOn(transformMock, 'transformInclude')
        .mockReturnValue(includedMock);
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue(dataMock);
      const joinMock = jest.spyOn(queryBuilderMock, 'leftJoinAndSelect');
      const whereMock = jest.spyOn(queryBuilderMock, 'where');
      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue({});

      const result = await service.getOne(optionsMock);

      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(transformDataMock).toBeCalled();
      expect(transformInclude).toBeCalled();
      expect(joinMock).toBeCalledTimes(2);
      expect(result).toEqual({
        included: includedMock,
        data: dataMock,
      });
    });

    it('should throw an error if resource not found', async () => {
      const optionsMock = {
        query: {
          include: [
            'first-relation',
            'second-relation'
          ],
        },
        route: {
          relName: 'relation',
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [{
          propertyPath: 'first-relation',
        }, {
          propertyPath: 'second-relation',
        }]
      };
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue(undefined);
      let error: HttpException;

      try {
        await service.getOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
      expect(getOneMock).toBeCalled();
    });
  });

  describe('Get direct one:', () => {
    it('should get one direct relation successful', async () => {
      const targetMock = class Target {};
      const optionsMock = {
        query: {
          include: [
            'first-relation',
            'second-relation'
          ],
        },
        route: {
          relName: 'relation',
          relId: 2,
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        target: targetMock,
        relations: [{
          inverseEntityMetadata: {
            relations: [{
              propertyPass: 'first'
            }, {
              propertyPass: 'second',
            }]
          },
          propertyPath: 'relation',
          type: targetMock,
        }]
      };

      const includedMock = [{ attributes: { someAttribute: 'value' }}];
      const dataMock = { attributes: { someAttribute: 'value' }};

      const transformInclude = jest.spyOn(transformMock, 'transformInclude')
        .mockReturnValue(includedMock);
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue(dataMock);
      const whereMock = jest.spyOn(queryBuilderMock, 'where');
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue({ relation: { id: 1 }});

      const result = await service.getDirectOne(optionsMock);

      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(transformDataMock).toBeCalled();
      expect(transformInclude).toBeCalled();
      expect(getOneMock).toBeCalled();
      expect(result).toEqual({
        included: includedMock,
        data: dataMock,
      });
    });

    it('should throw an error if target not found', async () => {
      const optionsMock = {
        query: {
          include: [
            'first-relation',
            'second-relation'
          ],
        },
        route: {
          relName: 'relation',
          relId: 2,
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
      };

      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue(undefined);
      let error: HttpException;
      try {
        await service.getDirectOne(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should create specific query builder on another type', async () => {
      const targetMock = class Target {};
      const optionsMock = {
        query: {
          include: [
            'first-relation',
            'second-relation'
          ],
        },
        route: {
          relName: 'relation',
          relId: 2,
          id: 1,
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        target: targetMock,
        relations: [{
          inverseEntityMetadata: {
            relations: [{
              propertyPass: 'first'
            }, {
              propertyPass: 'second',
            }]
          },
          propertyPath: 'relation',
          type: class Another {},
        }]
      };
      const createQueryBuilderMock = jest.spyOn(repoMock, 'createQueryBuilder');
      jest.spyOn(repoMock.manager, 'getRepository').mockReturnValue(repoMock);
      const whereMock = jest.spyOn(queryBuilderMock, 'where');
      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue({ relation: { id: 101 }});

      await service.getDirectOne(optionsMock);

      expect(whereMock.mock.calls[1][1]).toEqual({ id: optionsMock.route.relId });
      expect(whereMock.mock.calls[1][0]).toBe('test.id = :id');
      expect(createQueryBuilderMock).toBeCalledWith('relation');
    });
  });

  describe('Get all:', () => {
    it('should get all entities successful', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 1,
            size: 10,
          },
          filter: {},
          sort: {},
          include: [
            'some-relation',
            'another-relation',
          ]
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [],
      };

      const transformInclude = jest.spyOn(transformMock, 'transformInclude')
        .mockReturnValue([
          {
            id: '1',
            type: 'first'
          },
          {
            id: '2',
            type: 'second'
          }
        ]);
      const transformData = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({});
      const getMany = jest.spyOn(queryBuilderMock, 'getMany')
        .mockReturnValue([{ value: 100, }, { value: 200 }]);

      const result = await service.getAll(optionsMock);

      expect(transformInclude).toBeCalledTimes(2);
      expect(transformInclude.mock.calls[0][0]).toEqual({ value: 100 });
      expect(transformInclude.mock.calls[1][0]).toEqual({ value: 200 });

      expect(transformData).toBeCalledTimes(2);
      expect(transformData.mock.calls[0][0]).toEqual({ value: 100 });
      expect(transformData.mock.calls[1][0]).toEqual({ value: 200 });

      expect(getMany).toBeCalled();

      expect(result.included).toHaveLength(2);
      expect(result.data).toHaveLength(2);
    });

    it('should use pagination from query', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {},
          include: [
            'some-relation',
            'another-relation',
          ]
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [],
      };
      jest.spyOn(queryBuilderMock, 'getMany').mockReturnValue([{ value: 100, }, { value: 200 }]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const countMock = jest.spyOn(queryBuilderMock, 'getCount')
        .mockResolvedValue(100);
      const skipMock = jest.spyOn(queryBuilderMock, 'skip');
      const takeMock = jest.spyOn(queryBuilderMock, 'take');

      const result = await service.getAll(optionsMock);

      expect(skipMock).toBeCalledWith(20);
      expect(takeMock).toBeCalledWith(20);
      expect(countMock).toBeCalled();
      expect(result.meta).toEqual({
        totalItems: 100,
        pageNumber: 2,
        pageSize: 20,
      });
    });

    it('should include only unique relations', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {},
          include: [
            'first-relation',
            'second-relation',
          ]
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [],
      };
      jest.spyOn(queryBuilderMock, 'getMany').mockReturnValue([{ value: 100, }, { value: 200 }]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([
        {
          id: 1,
          type: 'first'
        },
        {
          id: 1,
          type: 'first',
        },
        {
          id: 2,
          type: 'second',
        },
        {
          id: 2,
          type: 'second',
        }
      ]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});

      const result = await service.getAll(optionsMock);
      expect(result.included).toHaveLength(2);
      expect(result.included).toEqual([
        {
          id: 1,
          type: 'first',
        },
        {
          id: 2,
          type: 'second',
        },
      ]);
    });

    it('should use sorting for target entity', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {
            someValue: 'DESC',
          },
          include: []
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [],
      };
      jest.spyOn(queryBuilderMock, 'getMany').mockReturnValue([{ value: 100, }, { value: 200 }]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const orderBy = jest.spyOn(queryBuilderMock, 'orderBy');

      await service.getAll(optionsMock);

      expect(orderBy).toBeCalledWith(optionsMock.query[QueryField.sort]);
    });

    it('should use sorting for relations', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {
            someValue: 'DESC',
          },
          include: [
            'some-relation',
            'another-relation',
          ]
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
        relations: [],
      };
      jest.spyOn(queryBuilderMock, 'getMany').mockReturnValue([{ value: 100, }, { value: 200 }]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const orderBy = jest.spyOn(queryBuilderMock, 'orderBy');

      await service.getAll(optionsMock);

      expect(orderBy).toBeCalledWith({
        'some-name.someValue': 'DESC'
      });
    });
  });

  describe('Get direct all:', () => {
    it('should get one direct entity successful', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 1,
            size: 10,
          },
          filter: {},
          sort: {},
          include: [
            'some-relation',
            'another-relation',
          ]
        },
        route: {
          relName: 'relation',
          id: 1
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        target: repoMock.target,
        name: 'some-name',
        relations: [{
          inverseEntityMetadata: {
            relations: []
          },
          propertyPath: 'relation',
          type: repoMock.target,
        }],
      };

      const transformIncludeMock = jest.spyOn(transformMock, 'transformInclude')
        .mockReturnValue([{}]);
      const transformDataMock = jest.spyOn(transformMock, 'transformData')
        .mockReturnValue({});
      const whereMock = jest.spyOn(queryBuilderMock, 'where');
      const getOneMock = jest.spyOn(queryBuilderMock, 'getOne')
        .mockReturnValue({ value: 100, relation: {id: 12} });

      const result = await service.getDirectAll(optionsMock);

      expect(whereMock.mock.calls[0][0]).toEqual({ id: 1 });
      expect(result.included).toHaveLength(1);
      expect(result.data).toEqual({});
      expect(transformIncludeMock).toBeCalled();
      expect(transformDataMock).toBeCalled();
      expect(getOneMock).toBeCalled();
    });

    it('should get all direct entities successful', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {},
          include: [
            'some-relation',
            'another-relation',
          ]
        },
        route: {
          relName: 'relation',
          id: 1
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        target: repoMock.target,
        name: 'some-name',
        relations: [{
          inverseEntityMetadata: {
            relations: []
          },
          propertyPath: 'relation',
          type: class AnotherEntity {},
        }],
      };

      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue({ value: 100, relation: {id: 12} });
      jest.spyOn(repoMock.manager, 'getRepository').mockReturnValue(repoMock);
      const transformIncludeMock = jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      const transformDataMock = jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const createQueryBuilderMock = jest.spyOn(repoMock, 'createQueryBuilder')
        .mockReturnValue(queryBuilderMock);
      const getManyMock = jest.spyOn(queryBuilderMock, 'getMany')
        .mockResolvedValue([{}, {}]);

      await service.getDirectAll(optionsMock);

      expect(createQueryBuilderMock.mock.calls[1][0]).toBe(repoMock.metadata.relations[0].propertyPath);
      expect(transformIncludeMock).toBeCalledTimes(2);
      expect(transformDataMock).toBeCalledTimes(2);
      expect(getManyMock).toBeCalled();
    });

    it('should use pagination from query', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {},
          include: [
            'some-relation',
            'another-relation',
          ]
        },
        filters: {},
        route: {
          relName: 'relation',
          id: 1
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        target: repoMock.target,
        name: 'some-name',
        relations: [{
          inverseEntityMetadata: {
            name: 'relation-name',
            relations: []
          },
          propertyPath: 'relation',
          type: class AnotherEntity {},
        }],
      };
      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue({ value: 100, relation: [{id: 12}] });
      jest.spyOn(repoMock.manager, 'getRepository').mockReturnValue(repoMock);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      jest.spyOn(queryBuilderMock, 'getMany').mockResolvedValue([{}, {}]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const countMock = jest.spyOn(queryBuilderMock, 'getCount')
        .mockResolvedValue(100);
      const skipMock = jest.spyOn(queryBuilderMock, 'skip');
      const takeMock = jest.spyOn(queryBuilderMock, 'take');

      const result = await service.getDirectAll(optionsMock);

      expect(skipMock).toBeCalledWith(20);
      expect(takeMock).toBeCalledWith(20);
      expect(countMock).toBeCalled();
      expect(result.meta).toEqual({
        totalItems: 100,
        pageNumber: 2,
        pageSize: 20,
      });
    });

    it('should use sorting from query', async () => {
      const optionsMock = {
        query: {
          page: {
            number: 2,
            size: 20,
          },
          filter: {},
          sort: {
            someField: 'DESC',
          },
          include: [
            'some-relation',
            'another-relation',
          ]
        },
        filters: {},
        route: {
          relName: 'relation',
          id: 1
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        target: repoMock.target,
        name: 'some-name',
        relations: [{
          inverseEntityMetadata: {
            name: 'relation-name',
            relations: []
          },
          propertyPath: 'relation',
          type: class AnotherEntity {},
        }],
      };
      jest.spyOn(queryBuilderMock, 'getOne').mockReturnValue({ value: 100, relation: [{id: 12}] });
      jest.spyOn(repoMock.manager, 'getRepository').mockReturnValue(repoMock);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      jest.spyOn(queryBuilderMock, 'getMany').mockResolvedValue([{}, {}]);
      jest.spyOn(transformMock, 'transformInclude').mockReturnValue([{}]);
      jest.spyOn(transformMock, 'transformData').mockReturnValue({});
      const orderBy = jest.spyOn(queryBuilderMock, 'orderBy')
        .mockResolvedValue(100);

      await service.getDirectAll(optionsMock);

      expect(orderBy).toBeCalledWith(optionsMock.query[QueryField.sort]);
    });

    it('should throw an error if entity does not exist', async () => {
      const optionsMock = {
        query: {},
        route: {
          relName: 'relation',
          id: 1
        }
      } as ServiceOptions<void>;
      repoMock.metadata = {
        name: 'some-name',
      };

      let error: HttpException;
      try {
        await service.getDirectAll(optionsMock);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(NotFoundException);
    });
  });
});
