import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';

import { PARAMS_RELATION_NAME } from '../../../constants';
import * as helpers from '../../../helpers/validation';
import { queryParamsMixin } from './query-params';

jest.mock('../../../helpers/validation');


describe('QueryParams', () => {
  const entityMock = class SomeEntityMock {};
  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const pipeMixin = queryParamsMixin(entityMock, mockConnectionName);
  let request;
  let repo: Repository<any>;
  let pipe: PipeTransform;
  const inputData = {
    'sort': {
      'id': 'ASC'
    },
    'filter': {
      'roles.id': {
        'eq': '1'
      },
      'roles.name': {
        'in': [
          '2',
          '3',
          '4'
        ]
      }
    },
    'include': [
      'roles',
      'supervisor'
    ],
    'page': {
      'number': 100,
      'size': 10
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        pipeMixin,
        {
          provide: repoToken,
          useValue: {
            metadata: {
              relations: [{
                propertyPath: 'relation-name',
                inverseEntityMetadata: {}
              }]
            }
          },
        },
        {
          provide: REQUEST,
          useValue: {
            params: {
              [PARAMS_RELATION_NAME]: 'relation-name',
            }
          }
        },
      ]
    }).compile();

    repo = module.get<Repository<any>>(repoToken);
    pipe = module.get<PipeTransform>(pipeMixin);
    request = module.get(REQUEST);
    jest.clearAllMocks();
  });


  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return value successful for entity', async () => {
    const checkResourceRelationName = (helpers.checkResourceRelationName as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([]);
    request.params[PARAMS_RELATION_NAME] = undefined;

    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkResourceRelationName).not.toBeCalled();
    expect(checkQueryIncludeParam).toBeCalled();
    expect(checkQueryParamSchema).toBeCalled();
    expect(checkQuerySortParam).toBeCalled();
    expect(result).toStrictEqual(inputData);
  });

  it('should return value successful for entity relation', async () => {
    const checkResourceRelationName = (helpers.checkResourceRelationName as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([]);
    request.params[PARAMS_RELATION_NAME] = 'relation-name';

    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkResourceRelationName).toBeCalled();
    expect(checkQueryIncludeParam).toBeCalled();
    expect(checkQueryParamSchema).toBeCalled();
    expect(checkQuerySortParam).toBeCalled();
    expect(result).toStrictEqual(inputData);
  });

  it('should throw an error if relation does not exist', async () => {
    const checkResourceRelationName = (helpers.checkResourceRelationName as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([]);
    request.params[PARAMS_RELATION_NAME] = 'wrong-name';

    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect(checkResourceRelationName).toBeCalled();
    expect(checkQueryIncludeParam).not.toBeCalled();
    expect(checkQueryParamSchema).not.toBeCalled();
    expect(checkQuerySortParam).not.toBeCalled();
  });

  it('should throw an error on filter validations fail', async () => {
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([]);
    request.params[PARAMS_RELATION_NAME] = undefined;

    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect(checkQueryIncludeParam).toBeCalled();
    expect(checkQueryParamSchema).toBeCalled();
    expect(checkQuerySortParam).toBeCalled();
  });

  it('should throw an error on sort validations fail', async () => {
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([{}]);
    request.params[PARAMS_RELATION_NAME] = undefined;

    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect(checkQueryIncludeParam).toBeCalled();
    expect(checkQueryParamSchema).toBeCalled();
    expect(checkQuerySortParam).toBeCalled();
  });

  it('should throw an error on include validations fail', async () => {
    const checkQueryIncludeParam = (helpers.checkQueryIncludeParam as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkQueryParamSchema = (helpers.checkQueryFilterParam as unknown as jest.Mock).mockResolvedValue([]);
    const checkQuerySortParam = (helpers.checkQuerySortParam as unknown as jest.Mock).mockResolvedValue([]);
    request.params[PARAMS_RELATION_NAME] = undefined;

    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    expect(checkQueryIncludeParam).toBeCalled();
    expect(checkQueryParamSchema).toBeCalled();
    expect(checkQuerySortParam).toBeCalled();
  });
});
