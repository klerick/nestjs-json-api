import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { IMemoryDb } from 'pg-mem';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  Users,
} from '../../../mock-utils';

import {
  CurrentDataSourceProvider,
  ZodInputQuerySchema,
} from '../../../factory';
import {
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
  ZOD_INPUT_QUERY_SCHEMA,
} from '../../../constants';
import { QueryInputPipe } from './query-input.pipe';
import {
  QueryField,
  ZodInputQuerySchema as TypeZodInputQuerySchema,
} from '../../../helper';

const page = {
  [QueryField.page]: {
    size: DEFAULT_PAGE_SIZE,
    number: DEFAULT_QUERY_PAGE,
  },
};

describe('QueryInputPipe', () => {
  let db: IMemoryDb;
  let queryInputPipe: QueryInputPipe<Users>;
  let zodParse: TypeZodInputQuerySchema<Users>;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        ZodInputQuerySchema(Users),
        QueryInputPipe,
      ],
    }).compile();

    queryInputPipe = module.get<QueryInputPipe<Users>>(QueryInputPipe);
    zodParse = module.get<TypeZodInputQuerySchema<Users>>(
      ZOD_INPUT_QUERY_SCHEMA
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be ok', () => {
    const input = {};
    const result = queryInputPipe.transform(input);

    const input1 = {
      [QueryField.page]: page[QueryField.page],
    };
    const result1 = queryInputPipe.transform(input1);

    const input2 = {
      ...page,
      [QueryField.fields]: { target: 'test', addresses: '' },
    };
    const result2 = queryInputPipe.transform(input2);

    expect(result).toEqual(page);
    expect(result1).toEqual(input1);
    expect(result2).toEqual(input2);
  });

  it('Should be not ok', () => {
    const input = {
      [QueryField.page]: {
        size: 0,
        number: 'sdfsdf',
      },
      sdaas: 'sdfsdf',
      [QueryField.include]: null,
      [QueryField.fields]: {
        dsada: 'sdfsf',
        sdfsdfsdfs: 'sdfsdf',
      },
      [QueryField.sort]: null,
      [QueryField.filter]: {
        id: {
          eq: 'null',
        },
      },
    };
    expect.assertions(1);
    try {
      const result = queryInputPipe.transform(input);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('Should be 500', () => {
    jest.spyOn(zodParse, 'parse').mockImplementationOnce(() => {
      throw new Error('Error mock');
    });
    expect.assertions(1);

    try {
      const result = queryInputPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
