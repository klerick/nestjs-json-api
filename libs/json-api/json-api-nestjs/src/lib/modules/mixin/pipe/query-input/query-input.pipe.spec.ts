import { QueryInputPipe } from './query-input.pipe';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodError } from 'zod';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ZOD_INPUT_QUERY_SCHEMA } from '../../../../constants';

class MockZodInputQuery {
  parse(value: unknown, options?: unknown) {
    return value;
  }
}

describe('QueryInputPipe', () => {
  let pipe: QueryInputPipe<any>;
  let zodSchemaMock: MockZodInputQuery;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryInputPipe,
        { provide: ZOD_INPUT_QUERY_SCHEMA, useClass: MockZodInputQuery },
      ],
    }).compile();

    pipe = module.get<QueryInputPipe<any>>(QueryInputPipe);
    zodSchemaMock = module.get<MockZodInputQuery>(ZOD_INPUT_QUERY_SCHEMA);
  });

  it('should parse the input successfully', () => {
    const input = { key: 'value' };
    jest.spyOn(zodSchemaMock, 'parse').mockReturnValue(input);

    const result = pipe.transform(input);
    expect(result).toBe(input);
    expect(zodSchemaMock.parse).toHaveBeenCalledWith(input);
  });

  it('should throw a BadRequestException when ZodError occurs', () => {
    const input = { invalid: 'data' };
    const mockZodError = new ZodError([]);

    jest.spyOn(zodSchemaMock, 'parse').mockImplementation(() => {
      throw mockZodError;
    });

    expect(() => pipe.transform(input)).toThrow(BadRequestException);
  });

  it('should throw an InternalServerErrorException for non-ZodError exceptions', () => {
    const input = { key: 'value' };
    const mockError = new Error('Unexpected error');

    jest.spyOn(zodSchemaMock, 'parse').mockImplementation(() => {
      throw mockError;
    });

    expect(() => pipe.transform(input)).toThrow(InternalServerErrorException);
  });
});
