import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { IMemoryDb } from 'pg-mem';
import { QueryPipe } from '../query';
import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  Users,
} from '../../../mock-utils';
import {
  QueryField,
  ZodQuerySchema as TypeZodQuerySchema,
} from '../../../helper';

import { CurrentDataSourceProvider, ZodQuerySchema } from '../../../factory';
import {
  DEFAULT_CONNECTION_NAME,
  ZOD_QUERY_SCHEMA,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
} from '../../../constants';
import { TransformInputService } from '../../../service';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

describe('QueryPipe', () => {
  let db: IMemoryDb;
  let queryPipe: QueryPipe<Users>;
  let zodParse: TypeZodQuerySchema<Users>;
  let transformInputService: TransformInputService<Users>;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        ZodQuerySchema(Users),
        TransformInputService,
        QueryPipe,
      ],
    }).compile();

    queryPipe = module.get<QueryPipe<Users>>(QueryPipe);
    zodParse = module.get<TypeZodQuerySchema<Users>>(ZOD_QUERY_SCHEMA);
    transformInputService = module.get<TransformInputService<Users>>(
      TransformInputService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be ok', () => {
    const filter = {
      target: null,
      relation: null,
    };

    const result = queryPipe.transform({
      [QueryField.page]: {
        size: DEFAULT_PAGE_SIZE,
        number: DEFAULT_QUERY_PAGE,
      },
    });
    expect(result).toEqual({
      [QueryField.filter]: filter,
      [QueryField.fields]: null,
      [QueryField.include]: null,
      [QueryField.sort]: null,
      [QueryField.page]: {
        size: DEFAULT_PAGE_SIZE,
        number: DEFAULT_QUERY_PAGE,
      },
    });
  });

  it('Should be not ok', () => {
    const input = {
      filter: {
        test: '',
      },
      [QueryField.page]: {
        size: DEFAULT_PAGE_SIZE,
        number: DEFAULT_QUERY_PAGE,
      },
    };
    expect.assertions(1);
    try {
      const result = queryPipe.transform(input as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('Should be 500', () => {
    jest
      .spyOn(transformInputService, 'transformSort')
      .mockImplementationOnce(() => {
        throw new Error('Error mock');
      });
    expect.assertions(1);

    try {
      const result = queryPipe.transform({} as any);
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
