import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {DataSource} from 'typeorm';

import {DEFAULT_CONNECTION_NAME, GLOBAL_MODULE_OPTIONS_TOKEN} from '../../../constants';
import {bodyInputPatchPipeMixin} from '../index';
import {entities, mockDBTestModule, Users} from '../../../mock-utils';

import {ajvFactory} from '../../../factory';
import {BodyInputPatchPipe} from './body-input-patch.pipe';
import {ResourceRequestObject} from '../../../types-common/request';
import {UnprocessableEntityException} from '@nestjs/common';


describe('BodyInputPatchPipe', () => {
  let pipe: BodyInputPatchPipe<Users>;
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const bodyInputPostMixinPip = bodyInputPatchPipeMixin(Users, mockConnectionName);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [
        bodyInputPostMixinPip,
        ajvFactory,
        {
          provide: GLOBAL_MODULE_OPTIONS_TOKEN,
          useValue: {
            entities: entities,
            connectionName: DEFAULT_CONNECTION_NAME
          }
        },
        {
          provide: getRepositoryToken(Users, mockConnectionName),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users)
          },
          inject: [
            getDataSourceToken()
          ]
        }
      ]
    }).compile();

    pipe = module.get<BodyInputPatchPipe<Users>>(bodyInputPostMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should be ok, undefined field not check', async () => {
      const data = {
        data: {
          id: '1',
          type: 'users',
          attributes: {
            login: 'testUser',
            firstName: 'testUser',
            isActive: true
          },
          relationships: {
          }
        }
      } as any;
      const result = await pipe.transform(data);
      expect(data.data).toEqual(result);
  });

  it('should be error, id required', async () => {
    const data = {
      data: {
        type: 'users',
        attributes: {
          login: 'testUser',
          firstName: 'testUser',
          isActive: true
        },
        relationships: {
        }
      }
    } as any;
      expect.assertions(3);
      try{
        await pipe.transform(data as any)
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e.response.message[0].detail).toBe('Must have required property \'id\'')
      }
  });

  it('should be error, id should be string number', async () => {
    const data = {
      data: {
        id: 'test',
        type: 'users',
        attributes: {
          login: 'testUser',
          firstName: 'testUser',
          isActive: true
        },
        relationships: {
        }
      }
    } as any;
    expect.assertions(3);
    try{
      await pipe.transform(data as any)
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0)
      expect(e.response.message[0].detail).toBe('Must match pattern "^\\d+$"')
    }
  });

  it('Should be error, nullable not empty field', async () => {
    const data = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          login: 'testUser',
          firstName: 'testUser',
          isActive: true
        },
        relationships: {
          addresses: {
            data: null
          }
        }
      }
    };
    expect.assertions(3);
    try{
      await pipe.transform(data as any)
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0)
      expect(e.response.message[0].detail).toBe('Addresses should not be empty')
    }
  })

  it('Should be ok, nullable relation', async () => {
    const data = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          login: 'testUser',
          firstName: 'testUser',
          isActive: true
        },
        relationships: {
          manager: {
            data: null
          },
          comments: {
            data: []
          },
        }
      }
    };
    const result = await pipe.transform(data as any);
    expect(result).toEqual(data.data)
  });

  it('Should be error incorrect field', async () => {
    const data = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          someField: 'testUser',
          firstName: 'testUser',
          isActive: true
        },
        relationships: {
          someRelation: {
            data: null
          }
        }
      }
    };
    expect.assertions(4);
    try{
      await pipe.transform(data as any)
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.message.length).toBeGreaterThan(0)
      expect(e.response.message[0].detail).toBe('Must NOT have additional properties. Additional Property is: "someField"')
      expect(e.response.message[1].detail).toBe('Must NOT have additional properties. Additional Property is: "someRelation"')
    }
  });

})
