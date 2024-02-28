import { IMemoryDb } from 'pg-mem';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentDataSourceProvider } from '../../../factory';
import {
  DEFAULT_CONNECTION_NAME,
  ZOD_POST_RELATIONSHIP_SCHEMA,
} from '../../../constants';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
} from '../../../mock-utils';

import { PostRelationshipPipe } from './post-relationship.pipe';
import { ZodInputPostRelationshipSchema } from '../../../helper/zod';
import { ZodError } from 'zod';

describe('PostInputPipe', () => {
  let db: IMemoryDb;
  let postRelationshipPipe: PostRelationshipPipe;
  let zodInputPostRelationshipSchema: ZodInputPostRelationshipSchema;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
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
    zodInputPostRelationshipSchema = module.get<ZodInputPostRelationshipSchema>(
      ZOD_POST_RELATIONSHIP_SCHEMA
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('It should be ok', () => {
    const data = {
      some: 'data',
    };
    const check = {
      data,
    };
    jest
      .spyOn(zodInputPostRelationshipSchema, 'parse')
      .mockImplementationOnce(() => check as any);
    expect(postRelationshipPipe.transform(check)).toEqual(data);
  });

  it('Should be not ok', () => {
    jest
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
    jest
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
