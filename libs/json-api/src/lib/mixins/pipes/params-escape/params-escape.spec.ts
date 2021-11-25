import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { paramsEscapeMixin } from './params-escape';

jest.mock('../../../helpers/validation');

describe('ParamsEscape', () => {
  const pipeMixin = paramsEscapeMixin();
  let pipe: PipeTransform;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        pipeMixin,
      ]
    }).compile();

    pipe = module.get<PipeTransform>(pipeMixin);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should not change value because of the non-empty "include"', async () => {
    const inputData = {
      'sort': {
        'id': 'ASC'
      },
      'filter': {
        'roles.id': {
          'eq': '1'
        },
        'roles.name': {
          'in': [
            '2',
            '3',
            '4'
          ]
        }
      },
      'include': [
        'roles',
        'supervisor'
      ],
      'page': {
        'number': 100,
        'size': 10
      }
    };

    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(result).toStrictEqual(inputData);
  });

  it('should escape sorting params because "include" is empty', async () => {
    const inputData = {
      'sort': {
        'id': 'ASC'
      },
      'filter': {
        'roles.id': {
          'eq': '1'
        },
        'roles.name': {
          'in': [
            '2',
            '3',
            '4'
          ]
        }
      },
      'include': {},
      'page': {
        'number': 100,
        'size': 10
      }
    };
    const expectedSort = {['"id"']: 'ASC'};

    const result = await pipe.transform(inputData, {} as ArgumentMetadata);
    expect(result).toStrictEqual({ ...inputData,  sort: expectedSort});
  });
});
