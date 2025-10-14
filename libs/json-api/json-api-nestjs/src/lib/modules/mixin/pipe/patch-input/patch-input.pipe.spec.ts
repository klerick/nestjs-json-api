import { ZodError } from 'zod';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PatchInputPipe } from './patch-input.pipe';
import { PostData, ZodPost } from '../../zod';
import { JSONValue } from '../../types';
import { ZOD_PATCH_SCHEMA } from '../../../../constants';

import { Users } from '../../../../utils/___test___/test-classes.helper';

describe('PostInputPipe', () => {
  let pipe: PatchInputPipe<Users>;
  let mockSchema: ZodPost<Users, 'id'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatchInputPipe,
        {
          provide: ZOD_PATCH_SCHEMA,
          useValue: {
            parse: vi.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<PatchInputPipe<Users>>(PatchInputPipe);
    mockSchema = module.get<ZodPost<Users, 'id'>>(ZOD_PATCH_SCHEMA);
  });

  it('should transform JSONValue to PostData on success', () => {
    const input: JSONValue = { key: 'value' } as any;
    const expectedData: PostData<Users, 'id'> = { id: 1, key: 'value' } as any;

    vi
      .spyOn(mockSchema, 'parse')
      .mockReturnValue({ data: expectedData } as any);

    expect(pipe.transform(input)).toEqual(expectedData);
    expect(mockSchema.parse).toHaveBeenCalledWith(input);
  });

  it('should throw BadRequestException if ZodError occurs', () => {
    const input: JSONValue = { key: 'value' };

    vi.spyOn(mockSchema, 'parse').mockImplementation(() => {
      throw new ZodError([]);
    });

    expect(() => pipe.transform(input)).toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException for non-Zod errors', () => {
    const input: JSONValue = { key: 'value' };

    vi.spyOn(mockSchema, 'parse').mockImplementation(() => {
      throw new Error('Unexpected Error');
    });

    expect(() => pipe.transform(input)).toThrow(InternalServerErrorException);
  });
});
