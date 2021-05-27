import { ArgumentMetadata, PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';

import { bodyPostRelationshipMixin } from './body-post-relationship';
import { PARAMS_RELATION_NAME } from '../../../constants';
import * as helpers from '../../../helpers/validation';

jest.mock('../../../helpers/validation');


describe('BodyPostRelationship', () => {
  const entityMock = class SomeEntityMock {};
  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const pipeMixin = bodyPostRelationshipMixin(entityMock, mockConnectionName);
  let pipe: PipeTransform;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        pipeMixin,
        {
          provide: repoToken,
          useValue: {
            metadata: {
              relations: [{
                propertyName: 'name'
              }]
            }
          },
        },
        {
          provide: REQUEST,
          useValue: {
            params: {
              [PARAMS_RELATION_NAME]: 'name',
            }
          }
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
    const checkRelationDataBasic = (helpers.checkRelationDataBasicInfo as unknown as jest.Mock).mockResolvedValue([]);
    const checkRelationDataType = (helpers.checkRelationDataType as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkRelationBodyStructure as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = { type: 'type', id: '' };
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkRelationDataBasic.mock.calls[0][0]).toBe(inputData);
    expect(checkRelationDataType.mock.calls[0][0]).toBe(inputData);
    expect(checkBodyData).toHaveBeenCalledWith(inputData);
    expect(result).toBe(inputData);
  });

  it('should throw an error if data not exists', async () => {
    const checkRelationDataBasic = (helpers.checkRelationDataBasicInfo as unknown as jest.Mock).mockResolvedValue([]);
    const checkRelationDataType = (helpers.checkRelationDataType as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkRelationBodyStructure as unknown as jest.Mock).mockResolvedValue([{}]);


    const inputData = { type: 'type', id: '' };
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData).toHaveBeenCalledWith(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(checkRelationDataBasic).not.toBeCalled();
    expect(checkRelationDataType).not.toBeCalled();
  });

  it('should throw an error on another validations', async () => {
    const checkRelationDataBasic = (helpers.checkRelationDataBasicInfo as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkRelationDataType = (helpers.checkRelationDataType as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkBodyData = (helpers.checkRelationBodyStructure as unknown as jest.Mock).mockResolvedValue([]);


    const inputData = { type: 'type', id: '' };
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData).toHaveBeenCalledWith(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(checkRelationDataBasic.mock.calls[0][0]).toStrictEqual(inputData);
    expect(checkRelationDataType.mock.calls[0][0]).toStrictEqual(inputData);
  });
});
