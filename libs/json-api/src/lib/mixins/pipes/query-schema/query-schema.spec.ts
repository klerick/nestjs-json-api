import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DEFAULT_QUERY_PAGE, DEFAULT_PAGE_SIZE } from '../../../constants';
import { querySchemaMixin } from './query-schema';
import * as helpers from '../../../helpers/validation';

jest.mock('../../../helpers/validation');


describe('QuerySchema', () => {
  const entityMock = class SomeEntityMock {};
  const pipeMixin = querySchemaMixin(entityMock);
  let pipe: PipeTransform;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [pipeMixin]
    }).compile();

    pipe = module.get<PipeTransform>(pipeMixin);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return value successful', async () => {
    const checkQueryParamSchema = (helpers.checkQueryParamsSchema as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = {
      include: 'roles,supervisor',
      filter: {
        'roles.id': '1',
        'roles.name': {
          'in': '2,3,4'
        },
        'ids': {
          'some': '1,2,3'
        }
      },
      sort: 'id',
      page: {
        number: '100',
        size: '10',
      }
    };
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkQueryParamSchema).toBeCalled();
    expect(result).toStrictEqual({
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
        },
        'ids':  {
          'some': [
            '1',
            '2',
            '3'
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
    });
  });

  it('should throw error when validation fails', async () => {
    const checkQueryParamSchema = (helpers.checkQueryParamsSchema as unknown as jest.Mock).mockResolvedValue([{}]);

    const inputData = {
      include: 'roles,supervisor',
      filter: {
        'roles.id': '1',
        'roles.name': {
          'in': '2,3,4'
        }
      },
      sort: 'id',
      page: {
        number: '100',
        size: '10',
      }
    };

    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(BadRequestException);
    expect(checkQueryParamSchema).toBeCalled();
  });

  it('should add default pages params', async () => {
    const checkQueryParamSchema = (helpers.checkQueryParamsSchema as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = {
      include: 'roles,supervisor',
      filter: {
        'roles.id': '1',
        'roles.name': {
          'in': '2,3,4'
        }
      },
      sort: 'id',
    };
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkQueryParamSchema).toBeCalled();
    expect(result.page.number).toBe(DEFAULT_QUERY_PAGE);
    expect(result.page.size).toBe(DEFAULT_PAGE_SIZE);
  });
});
