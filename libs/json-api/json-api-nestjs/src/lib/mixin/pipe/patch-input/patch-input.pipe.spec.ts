import { IMemoryDb } from 'pg-mem';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentDataSourceProvider } from '../../../factory';
import { DEFAULT_CONNECTION_NAME, ZOD_PATCH_SCHEMA } from '../../../constants';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  Users,
} from '../../../mock-utils';

import { PatchInputPipe } from './patch-input.pipe';
import { ZodInputPostSchema } from '../../../helper/zod';
import { ZodError } from 'zod';

describe('PatchInputPipe', () => {
  let db: IMemoryDb;
  let patchInputPipe: PatchInputPipe<Users>;
  let zodInputPostSchema: ZodInputPostSchema<Users>;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        {
          provide: ZOD_PATCH_SCHEMA,
          useValue: {
            parse() {},
          },
        },
        PatchInputPipe,
      ],
    }).compile();

    patchInputPipe = module.get<PatchInputPipe<Users>>(PatchInputPipe);
    zodInputPostSchema =
      module.get<ZodInputPostSchema<Users>>(ZOD_PATCH_SCHEMA);
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
      .spyOn(zodInputPostSchema, 'parse')
      .mockImplementationOnce(() => check as any);
    expect(patchInputPipe.transform(check)).toEqual(data);
  });

  it('Should be not ok', () => {
    jest.spyOn(zodInputPostSchema, 'parse').mockImplementationOnce(() => {
      throw new ZodError([]);
    });
    expect.assertions(1);
    try {
      patchInputPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('Should be 500', () => {
    jest.spyOn(zodInputPostSchema, 'parse').mockImplementationOnce(() => {
      throw new Error('Error mock');
    });
    expect.assertions(1);

    try {
      patchInputPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
