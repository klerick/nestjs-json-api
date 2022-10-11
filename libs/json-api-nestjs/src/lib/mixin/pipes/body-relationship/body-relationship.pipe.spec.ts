import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { BodyRelationshipPipe } from './body-relationship.pipe';
import { ajvFactory } from '../../../factory';
import { entities, mockDBTestModule, Users } from '../../../mock-utils';
import {
  CURRENT_DATA_SOURCE_TOKEN,
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import { DataSource } from 'typeorm';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

describe('BodyRelationshipPipe', () => {
  let pipe: BodyRelationshipPipe<Users>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        BodyRelationshipPipe,
        ajvFactory,
        {
          provide: GLOBAL_MODULE_OPTIONS_TOKEN,
          useValue: {
            entities: entities,
            connectionName: DEFAULT_CONNECTION_NAME,
          },
        },
        {
          provide: CURRENT_DATA_SOURCE_TOKEN,
          useFactory: (dataSource: DataSource) => dataSource,
          inject: [getDataSourceToken(DEFAULT_CONNECTION_NAME)],
        },
        {
          provide: getRepositoryToken(Users, DEFAULT_CONNECTION_NAME),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users);
          },
          inject: [
            {
              token: CURRENT_DATA_SOURCE_TOKEN,
              optional: false,
            },
          ],
        },
      ],
    }).compile();

    pipe = module.get<BodyRelationshipPipe<Users>>(BodyRelationshipPipe);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('Should be error, incorrect schema', async () => {
    const data = {
      data: { test: 'id' },
    };
    expect.assertions(6);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[1].detail).toBe(
        "Must have required property 'id'"
      );
      expect(e.response.message[2].detail).toBe('Must be array');
      expect(e.response.message[3].detail).toBe(
        'Must match exactly one schema: "object" or "array"'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be error, array is empty', async () => {
    const data = {
      data: [],
    };
    expect.assertions(5);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be object');
      expect(e.response.message[1].detail).toBe(
        'Must NOT have fewer than 1 items'
      );
      expect(e.response.message[2].detail).toBe(
        'Must match exactly one schema: "object" or "array"'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be error, array with incorrect items', async () => {
    const data = {
      data: [
        { someProps: 'type' },
        { someProps: 'type', id: 'wsdf' },
        { type: 'type', id: '2' },
      ],
    };
    expect.assertions(7);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be object');
      expect(e.response.message[1].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[2].detail).toBe(
        "Must have required property 'id'"
      );
      expect(e.response.message[3].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[4].detail).toBe(
        'Must match exactly one schema: "object" or "array"'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be be ok', async () => {
    const data = {
      data: { type: 'type', id: '2' },
    };
    const dataArray = {
      data: [{ type: 'type', id: '2' }],
    };

    const result = await pipe.transform(data as any);
    const resultArray = await pipe.transform(dataArray as any);

    expect(result).toEqual(data.data);
    expect(resultArray).toEqual(dataArray.data);
  });
});
