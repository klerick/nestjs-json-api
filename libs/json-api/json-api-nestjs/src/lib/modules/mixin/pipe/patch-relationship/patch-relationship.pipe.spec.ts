import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

import { ZOD_PATCH_RELATIONSHIP_SCHEMA } from '../../../../constants';

import { PatchRelationshipPipe } from './patch-relationship.pipe';
import { ZodPatchRelationship } from '../../zod';
import { ZodError } from 'zod';

describe('PatchInputPipe', () => {
  let patchRelationshipPipe: PatchRelationshipPipe;
  let zodInputPatchRelationshipSchema: ZodPatchRelationship;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ZOD_PATCH_RELATIONSHIP_SCHEMA,
          useValue: {
            parse() {},
          },
        },
        PatchRelationshipPipe,
      ],
    }).compile();

    patchRelationshipPipe = module.get<PatchRelationshipPipe>(
      PatchRelationshipPipe
    );
    zodInputPatchRelationshipSchema = module.get<ZodPatchRelationship>(
      ZOD_PATCH_RELATIONSHIP_SCHEMA
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
      .spyOn(zodInputPatchRelationshipSchema, 'parse')
      .mockImplementationOnce(() => check as any);
    expect(patchRelationshipPipe.transform(check)).toEqual(data);
  });

  it('Should be not ok', () => {
    jest
      .spyOn(zodInputPatchRelationshipSchema, 'parse')
      .mockImplementationOnce(() => {
        throw new ZodError([]);
      });
    expect.assertions(1);
    try {
      patchRelationshipPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('Should be 500', () => {
    jest
      .spyOn(zodInputPatchRelationshipSchema, 'parse')
      .mockImplementationOnce(() => {
        throw new Error('Error mock');
      });
    expect.assertions(1);

    try {
      patchRelationshipPipe.transform({});
    } catch (e) {
      expect(e).toBeInstanceOf(InternalServerErrorException);
    }
  });
});
