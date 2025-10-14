import { Test, TestingModule } from '@nestjs/testing';

import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ZOD_POST_RELATIONSHIP_SCHEMA } from '../../../../constants';

import { PostRelationshipPipe } from './post-relationship.pipe';
import { ZodPostRelationship } from '../../zod';
import { ZodError } from 'zod';

describe('PostInputPipe', () => {
  let postRelationshipPipe: PostRelationshipPipe;
  let zodInputPostRelationshipSchema: ZodPostRelationship;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ZOD_POST_RELATIONSHIP_SCHEMA,
          useValue: {
            parse() {},
          },
        },
        PostRelationshipPipe,
      ],
    }).compile();

    postRelationshipPipe =
      module.get<PostRelationshipPipe>(PostRelationshipPipe);
    zodInputPostRelationshipSchema = module.get<ZodPostRelationship>(
      ZOD_POST_RELATIONSHIP_SCHEMA
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('It should be ok', () => {
    const data = {
      some: 'data',
    };
    const check = {
      data,
    };
    vi
      .spyOn(zodInputPostRelationshipSchema, 'parse')
      .mockImplementationOnce(() => check as any);
    expect(postRelationshipPipe.transform(check)).toEqual(data);
  });

  it('Should be not ok', () => {
    vi
      .spyOn(zodInputPostRelationshipSchema, 'parse')
      .mockImplementationOnce(() => {
        throw new ZodError([]);
      });
    expect.assertions(1);
    try {
      postRelationshipPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('Should be 500', () => {
    vi
      .spyOn(zodInputPostRelationshipSchema, 'parse')
      .mockImplementationOnce(() => {
        throw new Error('Error mock');
      });
    expect.assertions(1);

    try {
      postRelationshipPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
