import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { BodyRelationshipPipe } from './body-relationship.pipe';
import { ajvFactory } from '../../../factory';
import { entities, mockDBTestModule, Users } from '../../../mock-utils';
import {
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';

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

  it('Should be error, incorrect id is no number string', async () => {
    const data = {
      data: { type: 'type', id: 'sdfsf' },
    };
    expect.assertions(5);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[1].detail).toBe('Must be array');
      expect(e.response.message[2].detail).toBe(
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

  it('Should be error, array with id no number', async () => {
    const data = {
      data: [
        { type: 'type', id: 'wsdf' },
        { type: 'type', id: '2' },
      ],
    };
    expect.assertions(5);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be object');
      expect(e.response.message[1].detail).toBe('Must match pattern "^\\d+$"');
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
    expect.assertions(8);
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
      expect(e.response.message[4].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[5].detail).toBe(
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
