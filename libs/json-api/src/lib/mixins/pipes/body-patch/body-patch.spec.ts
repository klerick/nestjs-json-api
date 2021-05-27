import { ArgumentMetadata, PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';

import { PARAMS_RESOURCE_ID } from '../../../constants';
import * as helpers from '../../../helpers/validation';
import { bodyPatchMixin } from './body-patch';

jest.mock('../../../helpers/validation');


describe('BodyPatch', () => {
  const entityMock = class SomeEntityMock {};
  const mockConnectionName = 'mockConnectionName';
  const repoToken = getRepositoryToken(entityMock, mockConnectionName);
  const pipeMixin = bodyPatchMixin(entityMock, mockConnectionName);
  let pipe: PipeTransform;
  let request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        pipeMixin,
        {
          provide: repoToken,
          useValue: {
            metadata: {}
          },
        },
        {
          provide: REQUEST,
          useValue: {
            params: {
              [PARAMS_RESOURCE_ID]: '1',
            }
          }
        },
      ]
    }).compile();

    request = module.get(REQUEST);
    pipe = module.get<PipeTransform>(pipeMixin);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return value successful without relations check', async () => {
    const checkResourceRelationsType = (helpers.checkResourceRelationsType as unknown as jest.Mock).mockResolvedValue([]);
    const checkResourceRelationsData = (helpers.checkResourceRelationsData as unknown as jest.Mock).mockResolvedValue([]);
    const checkAttributes = (helpers.checkClassValidatorFields as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = {
      type: 'type',
      id: '1',
      attributes: {
        id: '1'
      }
    };
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkAttributes.mock.calls[0][0]).toBe(inputData);
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(checkBodyData.mock.calls[0][2]).toBe(true);
    expect(checkBodyData.mock.calls[0][3]).toBe(true);
    expect(checkResourceRelationsType).not.toBeCalled();
    expect(checkResourceRelationsData).not.toBeCalled();
    expect(result).toBe(inputData);
  });

  it('shuld throw error if data id not equal to url param', async () => {
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = {
      type: 'type',
      id: '1',
      attributes: {
        id: '1'
      }
    };
    request.params[PARAMS_RESOURCE_ID] = '2';
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
  });

  it('should return value successful with relations check', async () => {
    const checkResourceRelationsType = (helpers.checkResourceRelationsType as unknown as jest.Mock).mockResolvedValue([]);
    const checkResourceRelationsData = (helpers.checkResourceRelationsData as unknown as jest.Mock).mockResolvedValue([]);
    const checkAttributes = (helpers.checkClassValidatorFields as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([]);

    const inputData = {
      type: 'type',
      id: '1',
      relationships: {
        relation: {
          data: {}
        }
      },
      attributes: {
        id: '1'
      }
    };
    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(checkAttributes.mock.calls[0][0]).toBe(inputData);
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(checkResourceRelationsType.mock.calls[0][0]).toBe(inputData);
    expect(checkResourceRelationsData.mock.calls[0][0]).toBe(inputData);
    expect(result).toBe(inputData);
  });

  it('should throw an error if data not exists', async () => {
    const checkResourceRelationsType = (helpers.checkResourceRelationsType as unknown as jest.Mock).mockResolvedValue([]);
    const checkResourceRelationsData = (helpers.checkResourceRelationsData as unknown as jest.Mock).mockResolvedValue([]);
    const checkAttributes = (helpers.checkClassValidatorFields as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([{}]);


    const inputData = {
      type: 'type',
      id: '1',
      relationships: {
        relation: {
          data: {}
        }
      },
      attributes: {
        id: '1'
      }
    };
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(checkResourceRelationsData).not.toBeCalled();
    expect(checkResourceRelationsType).not.toBeCalled();
    expect(checkAttributes).not.toBeCalled();
  });

  it('should throw an error on relations type without data check', async () => {
    const checkResourceRelationsType = (helpers.checkResourceRelationsType as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkResourceRelationsData = (helpers.checkResourceRelationsData as unknown as jest.Mock).mockResolvedValue([]);
    const checkAttributes = (helpers.checkClassValidatorFields as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([]);


    const inputData = {
      type: 'type',
      id: '1',
      relationships: {
        relation: {
          data: {}
        }
      },
      attributes: {
        id: '1'
      }
    };
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(checkResourceRelationsData).not.toBeCalled();
    expect(checkResourceRelationsType).toBeCalled();
    expect(checkAttributes).toBeCalled();
  });

  it('should throw an error on relations with data check', async () => {
    const checkResourceRelationsData = (helpers.checkResourceRelationsData as unknown as jest.Mock).mockResolvedValue([{}]);
    const checkResourceRelationsType = (helpers.checkResourceRelationsType as unknown as jest.Mock).mockResolvedValue([]);
    const checkAttributes = (helpers.checkClassValidatorFields as unknown as jest.Mock).mockResolvedValue([]);
    const checkBodyData = (helpers.checkResourceBodyStructure as unknown as jest.Mock).mockResolvedValue([]);


    const inputData = {
      type: 'type',
      id: '1',
      relationships: {
        relation: {
          data: {}
        }
      },
      attributes: {
        id: '1'
      }
    };
    let error;
    try {
      await pipe.transform(inputData, {} as ArgumentMetadata);
    } catch (e) {
      error = e;
    }
    expect(checkBodyData.mock.calls[0][0]).toBe(inputData);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(checkResourceRelationsData).toBeCalled();
    expect(checkResourceRelationsType).toBeCalled();
    expect(checkAttributes).toBeCalled();
  });
});
