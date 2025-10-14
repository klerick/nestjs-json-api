import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterOperand, QueryField } from '@klerick/json-api-nestjs-shared';
import { ZodError } from 'zod';

import { QueryPipe } from './query.pipe';
import { ASC, ZOD_QUERY_SCHEMA } from '../../../../constants';
import { ZodQuery, InputQuery, Query } from '../../zod';
import { Users } from '../../../../utils/___test___/test-classes.helper';

describe('QueryPipe', () => {
  let queryPipe: QueryPipe<Users>;
  let zodQuerySchemaMock: ZodQuery<Users, 'id'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryPipe,
        {
          provide: ZOD_QUERY_SCHEMA,
          useValue: {
            parse: vi.fn(),
          },
        },
      ],
    }).compile();

    queryPipe = module.get<QueryPipe<Users>>(QueryPipe);
    zodQuerySchemaMock = module.get<ZodQuery<Users, 'id'>>(ZOD_QUERY_SCHEMA);
  });

  it('should parse the query successfully using the zod schema', () => {
    const inputQuery: InputQuery<Users, 'id'> = {
      [QueryField.fields]: {
        target: ['id', 'name'],
        addresses: undefined,
        manager: undefined,
        roles: undefined,
        comments: undefined,
        userGroup: undefined
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
    const parsedQuery: Query<Users, 'id'> = {
      [QueryField.fields]: {
        target: ['id', 'lastName'],
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

    vi.spyOn(zodQuerySchemaMock, 'parse').mockReturnValue(parsedQuery);

    const result = queryPipe.transform(inputQuery);

    expect(result).toEqual(parsedQuery);
    expect(zodQuerySchemaMock.parse).toHaveBeenCalledWith(inputQuery);
  });

  it('should throw BadRequestException if ZodError is thrown', () => {
    const inputQuery = {
      id: 1,
      name: 'Invalid',
    } as unknown as InputQuery<Users, 'id'>;
    const zodError = new ZodError([]);

    vi.spyOn(zodQuerySchemaMock, 'parse').mockImplementation(() => {
      throw zodError;
    });

    expect(() => queryPipe.transform(inputQuery)).toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException if an unknown error is thrown', () => {
    const inputQuery = {
      id: 1,
      name: 'Invalid',
    } as unknown as InputQuery<Users, 'id'>;
    const unexpectedError = new Error('Unexpected error');

    vi.spyOn(zodQuerySchemaMock, 'parse').mockImplementation(() => {
      throw unexpectedError;
    });

    expect(() => queryPipe.transform(inputQuery)).toThrow(
      InternalServerErrorException
    );
  });
});
