import { ZodError } from 'zod';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PostInputPipe } from './post-input.pipe';
import { PostData, ZodPost } from '../../zod';
import { JSONValue } from '../../types';
import { ZOD_POST_SCHEMA } from '../../../../constants';
import { Users } from '../../../../utils/___test___/test-classes.helper';

describe('PostInputPipe', () => {
  let pipe: PostInputPipe<Users>;
  let mockSchema: ZodPost<Users, 'id'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostInputPipe,
        {
          provide: ZOD_POST_SCHEMA,
          useValue: {
            parse: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<PostInputPipe<Users>>(PostInputPipe);
    mockSchema = module.get<ZodPost<Users, 'id'>>(ZOD_POST_SCHEMA);
  });

  it('should transform JSONValue to PostData on success', () => {
    const input: JSONValue = { key: 'value' } as any;
    const expectedData: PostData<Users, 'id'> = { id: 1, key: 'value' } as any;

    jest
      .spyOn(mockSchema, 'parse')
      .mockReturnValue({ data: expectedData } as any);

    expect(pipe.transform(input)).toEqual(expectedData);
    expect(mockSchema.parse).toHaveBeenCalledWith(input, {
      errorMap: expect.any(Function),
    });
  });

  it('should throw BadRequestException if ZodError occurs', () => {
    const input: JSONValue = { key: 'value' };

    jest.spyOn(mockSchema, 'parse').mockImplementation(() => {
      throw new ZodError([]);
    });

    expect(() => pipe.transform(input)).toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException for non-Zod errors', () => {
    const input: JSONValue = { key: 'value' };

    jest.spyOn(mockSchema, 'parse').mockImplementation(() => {
      throw new Error('Unexpected Error');
    });

    expect(() => pipe.transform(input)).toThrow(InternalServerErrorException);
  });
});
