import {Test, TestingModule} from '@nestjs/testing';
import {DataSource} from 'typeorm';
import {BadRequestException} from '@nestjs/common';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';

import {QueryFiledInIncludePipe} from './query-filed-in-include.pipe';
import {Entity as EntityClassOrSchema, QueryField, QueryParams} from '../../../types';
import {DEFAULT_CONNECTION_NAME, DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE} from '../../../constants';
import {queryFiledInIncludeMixin} from '../index';
import {mockDBTestModule, Users} from '../../../mock-utils';


describe('QueryFiledInIncludePipe', () => {
  let pipe: QueryFiledInIncludePipe<EntityClassOrSchema>;
  const defaultField: QueryParams<EntityClassOrSchema> = {
    needAttribute: false,
    page: {
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    },
    [QueryField.fields]: null,
    [QueryField.sort]: null,
    [QueryField.include]: null,
    [QueryField.filter]: {
      target: null,
      relation: null
    }
  }
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const querySchemaMixinPip = queryFiledInIncludeMixin(Users, mockConnectionName);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [
        querySchemaMixinPip,
        {
          provide: getRepositoryToken(Users, mockConnectionName),
          useFactory(dataSource: DataSource){
            return dataSource.getRepository<Users>(Users)
          },
          inject: [
            getDataSourceToken()
          ]
        }
      ]
    }).compile();

    pipe = module.get<QueryFiledInIncludePipe<EntityClassOrSchema>>(querySchemaMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should be not error with empty object', async () => {
    const inputResult: QueryParams<EntityClassOrSchema> = {
      ...defaultField,
    }
    const result = await pipe.transform(inputResult);
    expect(result).toEqual(result);
  })

  it('should be error field not have include', async () => {
    const inputResult: QueryParams<EntityClassOrSchema> = {
      ...defaultField,
      fields: {
        relationName2: ['field', 'field']
      }
    } as unknown as QueryParams<EntityClassOrSchema>

    expect.assertions(3);
    try {
      await pipe.transform(inputResult)
    } catch (e) {
      const errorCount = e.response.message.filter(i => i.source.parameter === '/fields').length;
      expect(errorCount).toEqual(e.response.message.length);
      expect(errorCount).toBeGreaterThan(0);
      expect(e).toBeInstanceOf(BadRequestException)
    }
  })

  it('should be error sort not have include', async () => {
    const inputResult: QueryParams<EntityClassOrSchema> = {
      ...defaultField,
      sort: {
        targetResource: {},
        relationName2: {
          field: 'ASC'
        },
        relationName1: {
          field: 'DESC'
        }
      },
    } as unknown as QueryParams<EntityClassOrSchema>

    expect.assertions(3);
    try {
      await pipe.transform(inputResult)
    } catch (e) {
      const errorCount = e.response.message.filter(i => i.source.parameter === '/sort').length;
      expect(errorCount).toEqual(e.response.message.length);
      expect(errorCount).toBeGreaterThan(0);
      expect(e).toBeInstanceOf(BadRequestException)
    }
  });
})
