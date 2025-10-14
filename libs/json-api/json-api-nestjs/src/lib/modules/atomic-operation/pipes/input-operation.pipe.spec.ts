import { Test, TestingModule } from '@nestjs/testing';
import { KEY_MAIN_INPUT_SCHEMA } from '@klerick/json-api-nestjs-shared';
import { ZodError } from 'zod';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

import { InputOperationPipe } from './input-operation.pipe';

import { ZOD_INPUT_OPERATION } from '../constants';
import { ZodInputOperation } from '../utils';

describe('PatchInputPipe', () => {
  let patchInputPipe: InputOperationPipe;
  let zodInputOperation: ZodInputOperation<object>;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ZOD_INPUT_OPERATION,
          useValue: {
            parse() {},
          },
        },
        InputOperationPipe,
      ],
    }).compile();

    patchInputPipe = module.get<InputOperationPipe>(InputOperationPipe);
    zodInputOperation =
      module.get<ZodInputOperation<object>>(ZOD_INPUT_OPERATION);
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
      [KEY_MAIN_INPUT_SCHEMA]: data,
    };
    vi
      .spyOn(zodInputOperation, 'parse')
      .mockImplementationOnce(() => check as any);
    expect(patchInputPipe.transform(check)).toEqual(data);
  });

  it('Should be not ok', () => {
    vi.spyOn(zodInputOperation, 'parse').mockImplementationOnce(() => {
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
    vi.spyOn(zodInputOperation, 'parse').mockImplementationOnce(() => {
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
