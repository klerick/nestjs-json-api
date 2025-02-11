import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodError } from 'zod';

import { QueryPipe } from './query.pipe';
import { ASC, ZOD_QUERY_SCHEMA } from '../../../../constants';
import { ZodQuery, InputQuery, Query } from '../../zod';
import { FilterOperand, QueryField } from '../../../../utils/nestjs-shared';

type MockEntity = { id: number; name: string };

describe('QueryPipe', () => {
  let queryPipe: QueryPipe<MockEntity>;
  let zodQuerySchemaMock: ZodQuery<MockEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryPipe,
        {
          provide: ZOD_QUERY_SCHEMA,
          useValue: {
            parse: jest.fn(),
          },
        },
      ],
    }).compile();

    queryPipe = module.get<QueryPipe<MockEntity>>(QueryPipe);
    zodQuerySchemaMock = module.get<ZodQuery<MockEntity>>(ZOD_QUERY_SCHEMA);
  });

  it('should parse the query successfully using the zod schema', () => {
    const inputQuery: InputQuery<MockEntity> = {
      [QueryField.fields]: {
        target: ['id', 'name'],
      },
      [QueryField.filter]: {
        relation: null,
        target: {
          id: {
            [FilterOperand.eq]: '1',
          },
        },
      },
      [QueryField.include]: null,
      [QueryField.sort]: { target: { id: ASC } },
      [QueryField.page]: { number: 1, size: 10 },
    };
    const parsedQuery: Query<MockEntity> = {
      [QueryField.fields]: {
        target: ['id', 'name'],
      },
      [QueryField.filter]: {
        relation: null,
        target: {
          id: {
            eq: '1',
          },
        },
      },
      [QueryField.include]: null,
      [QueryField.sort]: { target: { id: ASC } },
      [QueryField.page]: { number: 1, size: 10 },
    };

    jest.spyOn(zodQuerySchemaMock, 'parse').mockReturnValue(parsedQuery);

    const result = queryPipe.transform(inputQuery);

    expect(result).toEqual(parsedQuery);
    expect(zodQuerySchemaMock.parse).toHaveBeenCalledWith(inputQuery);
  });

  it('should throw BadRequestException if ZodError is thrown', () => {
    const inputQuery = {
      id: 1,
      name: 'Invalid',
    } as unknown as InputQuery<MockEntity>;
    const zodError = new ZodError([]);

    jest.spyOn(zodQuerySchemaMock, 'parse').mockImplementation(() => {
      throw zodError;
    });

    expect(() => queryPipe.transform(inputQuery)).toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException if an unknown error is thrown', () => {
    const inputQuery = {
      id: 1,
      name: 'Invalid',
    } as unknown as InputQuery<MockEntity>;
    const unexpectedError = new Error('Unexpected error');

    jest.spyOn(zodQuerySchemaMock, 'parse').mockImplementation(() => {
      throw unexpectedError;
    });

    expect(() => queryPipe.transform(inputQuery)).toThrow(
      InternalServerErrorException
    );
  });
});
