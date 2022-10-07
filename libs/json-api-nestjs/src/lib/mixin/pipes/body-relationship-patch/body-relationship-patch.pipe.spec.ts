import { Test, TestingModule } from '@nestjs/testing';

import { ajvFactory } from '../../../factory';
import { entities, mockDBTestModule, Users } from '../../../mock-utils';
import { BodyRelationshipPatchPipe } from './body-relationship-patch.pipe';
import {
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import { BadRequestException } from '@nestjs/common';

describe('BodyRelationshipPatchPipe', () => {
  let pipe: BodyRelationshipPatchPipe<Users>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        BodyRelationshipPatchPipe,
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

    pipe = module.get<BodyRelationshipPatchPipe<Users>>(
      BodyRelationshipPatchPipe
    );
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
    expect.assertions(8);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be null');
      expect(e.response.message[1].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[2].detail).toBe(
        "Must have required property 'id'"
      );
      expect(e.response.message[3].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[4].detail).toBe('Must be array');
      expect(e.response.message[5].detail).toBe(
        'Must match exactly one schema: "object" or "array"'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be error, incorrect id is no number string', async () => {
    const data = {
      data: { type: 'type', id: 'sdfsf' },
    };
    expect.assertions(7);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be null');
      expect(e.response.message[1].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[2].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[3].detail).toBe('Must be array');
      expect(e.response.message[4].detail).toBe(
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
    expect.assertions(9);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be null');
      expect(e.response.message[1].detail).toBe('Must be object');
      expect(e.response.message[2].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[3].detail).toBe('Must be null');
      expect(e.response.message[4].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[5].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[6].detail).toBe(
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
    expect.assertions(14);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe('Must be null');
      expect(e.response.message[1].detail).toBe('Must be object');
      expect(e.response.message[2].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[3].detail).toBe('Must be null');
      expect(e.response.message[4].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[5].detail).toBe(
        "Must have required property 'id'"
      );
      expect(e.response.message[6].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[7].detail).toBe('Must be null');
      expect(e.response.message[8].detail).toBe(
        "Must have required property 'type'"
      );
      expect(e.response.message[9].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[10].detail).toBe(
        'Must match exactly one schema: "null" or "object"'
      );
      expect(e.response.message[11].detail).toBe(
        'Must match exactly one schema: "object" or "array"'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be ok', async () => {
    const data = {
      data: { type: 'type', id: '2' },
    };
    const dataArray = {
      data: [{ type: 'type', id: '2' }],
    };
    const dataEmptyArray = {
      data: [],
    };
    const dataEmpty = {
      data: null,
    };

    const result = await pipe.transform(data as any);
    const resultArray = await pipe.transform(dataArray as any);
    const resultEmptyArray = await pipe.transform(dataEmptyArray as any);
    const resultEmpty = await pipe.transform(dataEmpty as any);

    expect(result).toEqual(data.data);
    expect(resultArray).toEqual(dataArray.data);
    expect(resultEmptyArray).toEqual(dataEmptyArray.data);
    expect(resultEmpty).toEqual(dataEmpty.data);
  });
});
