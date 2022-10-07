import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import { bodyInputPostMixin } from '../index';
import { entities, mockDBTestModule, Users } from '../../../mock-utils';

import { ajvFactory } from '../../../factory';
import { BodyInputPostPipe } from './body-input-post.pipe';
import { ResourceRequestObject } from '../../../types-common/request';
import { UnprocessableEntityException } from '@nestjs/common';

describe('BodyInputPostPipe', () => {
  let pipe: BodyInputPostPipe<Users>;
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const bodyInputPostMixinPip = bodyInputPostMixin(Users, mockConnectionName);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        bodyInputPostMixinPip,
        ajvFactory,
        {
          provide: GLOBAL_MODULE_OPTIONS_TOKEN,
          useValue: {
            entities: entities,
            connectionName: DEFAULT_CONNECTION_NAME,
          },
        },
        {
          provide: getRepositoryToken(Users, mockConnectionName),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users);
          },
          inject: [getDataSourceToken()],
        },
      ],
    }).compile();

    pipe = module.get<BodyInputPostPipe<Users>>(bodyInputPostMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should be error, relationships required', async () => {
    const data = {
      data: {
        type: 'users',
        attributes: {
          login: 'testUser',
          firstName: 'testUser',
          isActive: true,
        },
        relationships: {},
      },
    };
    expect.assertions(3);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message[0].detail).toBe(
        'Addresses should not be empty'
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('should be error, additional property and incorrect type', async () => {
    const data = {
      data: {
        type: 'user',
        id: '1',
        attributes: {
          updatedAt: new Date(),
          login: 'tes',
          test: 'dsfsdf',
        },
        relationships: {
          test: {},
          comments: {},
          manager: { re: 'erwer' },
        },
      },
    };
    expect.assertions(9);
    try {
      await pipe.transform(data as any);
    } catch (e) {
      expect(e.response.message[0].detail).toBe(
        'Must NOT have additional properties. Additional Property is: "id"'
      );
      expect(e.response.message[1].detail).toBe(
        'Must be equal to one of the allowed values. Allowed values are: "users"'
      );
      expect(e.response.message[2].detail).toBe(
        'Must NOT have additional properties. Additional Property is: "test"'
      );
      expect(e.response.message[3].detail).toBe('Must be string');
      expect(e.response.message[4].detail).toBe(
        'Must NOT have additional properties. Additional Property is: "test"'
      );
      expect(e.response.message[5].detail).toBe(
        "Must have required property 'data'"
      );
      expect(e.response.message[6].detail).toBe(
        "Must have required property 'data'"
      );
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be error, id string should be number pattern', async () => {
    const data: ResourceRequestObject<Users> = {
      data: {
        type: 'users',
        attributes: {
          // @ts-ignore
          updatedAt: new Date().toISOString(),
          login: 'tes',
          isActive: true,
          // @ts-ignore
          createdAt: new Date().toISOString(),
        },
        relationships: {
          comments: {
            data: [
              {
                type: 'comments',
                id: 'sdfsdf',
              },
            ],
          },
          manager: {
            data: {
              type: 'users',
              id: 'sdfsdf',
            },
          },
        },
      },
    };
    expect.assertions(4);
    try {
      await pipe.transform(data);
    } catch (e) {
      expect(e.response.message[0].detail).toBe('Must match pattern "^\\d+$"');
      expect(e.response.message[1].detail).toBe('Must match pattern "^\\d+$"');
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be error, relationships array is empty', async () => {
    const data: ResourceRequestObject<Users> = {
      data: {
        type: 'users',
        attributes: {
          // @ts-ignore
          updatedAt: new Date().toISOString(),
          login: 'tes',
          isActive: true,
          // @ts-ignore
          createdAt: new Date().toISOString(),
        },
        relationships: {
          comments: {
            data: [],
          },
          manager: {
            data: {
              type: 'users',
              id: '1',
            },
          },
        },
      },
    };
    expect.assertions(3);
    try {
      await pipe.transform(data);
    } catch (e) {
      expect(e.response.message[0].detail).toBe(
        'Must NOT have fewer than 1 items'
      );
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('should be error validate class', async () => {
    const data: ResourceRequestObject<Users> = {
      data: {
        type: 'users',
        attributes: {
          // @ts-ignore
          updatedAt: new Date().toISOString(),
          login: 'tes',
          isActive: true,
          // @ts-ignore
          createdAt: new Date().toISOString(),
        },
        relationships: {
          comments: {
            data: [],
          },
        },
      },
    };
    expect.assertions(2);
    try {
      await pipe.transform(data);
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('should be correct', async () => {
    const date = new Date();
    const resultCheck = {
      data: {
        type: 'users',
        attributes: {
          login: 'test login',
          isActive: true,
        },
        relationships: {
          comments: {
            data: [
              {
                type: 'comments',
                id: '1',
              },
            ],
          },
          manager: {
            data: {
              type: 'users',
              id: '1',
            },
          },
          addresses: {
            data: {
              type: 'addresses',
              id: '1',
            },
          },
        },
      },
    };
    const data: ResourceRequestObject<Users> = {
      data: {
        type: 'users',
        attributes: {
          // @ts-ignore
          testDate: date.toISOString(),
          login: 'test login',
          isActive: true,
        },
        relationships: {
          comments: {
            data: [
              {
                type: 'comments',
                id: '1',
              },
            ],
          },
          manager: {
            data: {
              type: 'users',
              id: '1',
            },
          },
          addresses: {
            data: {
              type: 'addresses',
              id: '1',
            },
          },
        },
      },
    };

    const result = await pipe.transform(data);
    const dateCheck = result.attributes.testDate;
    delete result.attributes.testDate;
    expect(dateCheck).toBeInstanceOf(Date);
    expect(JSON.stringify(resultCheck.data)).toBe(JSON.stringify(result));
  });
});
