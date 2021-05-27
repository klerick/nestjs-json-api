import { ArgumentMetadata, PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { parseRelationshipNameMixin } from './parse-relationship-name';
import * as helpers from '../../../helpers/validation';

jest.mock('../../../helpers/validation');


describe('ParseRelationshipName', () => {
  const entityMock = class SomeEntityMock {};
  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const pipeMixin = parseRelationshipNameMixin(entityMock, mockConnectionName);
  let pipe: PipeTransform;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        pipeMixin,
        {
          provide: repoToken,
          useValue: {
            metadata: {}
          },
        },
      ]
    }).compile();

    pipe = module.get<PipeTransform>(pipeMixin);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return value successful', async () => {
    const checkRelationName = (helpers.checkResourceRelationName as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = 'some-relation';
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkRelationName.mock.calls[0][0]).toBe(inputData);
    expect(result).toBe(inputData);
  });

  it('should return error if relation does not exist', async () => {
    const checkRelationName = (helpers.checkResourceRelationName as unknown as jest.Mock).mockResolvedValue([{}]);

    const inputData = 'some-relation';
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkRelationName.mock.calls[0][0]).toBe(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
  });
});
