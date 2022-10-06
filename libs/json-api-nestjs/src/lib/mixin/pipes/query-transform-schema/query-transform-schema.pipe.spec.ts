import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';

import {QueryTransformSchemaPipe} from './query-transform-schema.pipe';
import {queryTransformSchemaMixin} from '../index';
import {DataSource} from 'typeorm';

import {ajvFactory} from '../../../factory';
import {Entity as EntityClassOrSchema, QueryField, QueryParams} from '../../../types';
import {BadRequestException} from '@nestjs/common';
import {
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
  GLOBAL_MODULE_OPTIONS_TOKEN
} from '../../../constants';
import {
  entities,
  mockDBTestModule,
  Users
} from '../../../mock-utils';



describe('QueryTransformSchema', () => {
  const resultInputMock: QueryParams<EntityClassOrSchema> = {
    [QueryField.needAttribute]: false,
    [QueryField.page]: {
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    },
    [QueryField.fields]: null,
    [QueryField.sort]: null,
    [QueryField.include]: null,
    [QueryField.filter]: {
      relation: null,
      target: null
    }
  }

  let pipe: QueryTransformSchemaPipe<Users>;
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const querySchemaMixinPip = queryTransformSchemaMixin(Users, mockConnectionName);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [
        querySchemaMixinPip,
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
          useFactory(dataSource: DataSource){
            return dataSource.getRepository<Users>(Users)
          },
          inject: [
            getDataSourceToken()
          ]
        }
      ]
    }).compile();

    pipe = module.get<QueryTransformSchemaPipe<Users>>(querySchemaMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('Check fields', () => {
    it('Correct if field object null ', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        fields: null
      } as any;

      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput)
    });

    it('Check field should be correct', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        fields: {
          target: ['firstName', 'isActive'],
          addresses: ['state']
        }
      };
      const result = await pipe.transform(resultInput);

      expect(result).toEqual(resultInput)
    });

    it('Error in field object', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        fields: {
          targetResource: ['columnName11', 'columnName2'],
          relationName23: ['relationName2Field'],
          relationName2: ['relationName2Field3', 'relationName2Field'],
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'fields').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)

      }
    });

    it('Should not be error if fields is null', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        fields: null
      } as any;
      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput)
    })

    it('Should be error if fields object is empty', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        fields: {}
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'fields').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    })

    it('Should be error if filed is exclude', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        fields: {
          target: ['lastName'],
          addresses: ['state']
        }
      };
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'fields').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    })
  });

  describe('Check filter', () => {

    it('Error if operand for field more one', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        filter: {
          target: {
            firstName: {
              eq: '1',
              like: 'test'
            },
          },
          relation: null
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    })

    it('Error if incorrect filter object', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        filter: {
          target: {
            incorrectField: {
              eq: '1'
            },
            columnArray: {
              eq: '1'
            },
            columnName2: {
              some: ['1', '1']
            },
            columnName3: {
              test: 'test'
            },
            relationName1: {
              like: 'test'
            },
            relationName2: {
              eq: 'test'
            }
          },
          relation: {
            incorrectRelation: {
              test: {
                eq: '1'
              }
            },
            relationName1: {
              relationName1Field: {
                eq: '1'
              },
              relationName1Field1: {
                some: ['test']
              },
              incorrectField: {
                eq: 'test'
              }
            },
            relationName2: {
              relationName2Field: {
                test: '1'
              }
            }
          }
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    });

    it('Error if filter object is empty', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        filter: {
          target: {},
          relation: {}
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    });

    it('Error if operand object and relation object is empty', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        filter: {
          target: {
            columnName1: {},
            columnName2: null
          },
          relation: {
            relationName1: {},
            relationName2: null
          }
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    });

    it('Error if operand object and operand for relation object is empty', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        filter: {
          target: {
            columnName1: {},
            columnName2: null
          },
          relation: {
            relationName1: {
              relationName1Field1: null
            },
            relationName2: {
              relationName2Field: {}
            }
          }
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    });

    it('Error if operand incorrect type', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        filter: {
          target: {
            columnName1: {
              eq: 1
            },
            columnName2: {
              in: 'q'
            }
          },
          relation: {
            relationName1: {
              relationName1Field1: {
                like: 1
              }
            },
            relationName2: {
              relationName2Field: {
                nin: 1
              }
            }
          }
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException)
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'filter').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
      }
    });

    it('Correct filter object', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        filter: {
          target: {
            login: {
              eq: 'q'
            },
            isActive: {
              in: ['q']
            }
          },
          relation: {
            addresses: {
              arrayField: {
                some: ['r']
              },
              state: {
                like: 'q'
              }
            },
            comments: {
              kind: {
                nin: ['d']
              }
            }
          }
        }
      };

      const result = await pipe.transform(resultInput);
      expect(result).toEqual(result);
    })

    it('Correct filter object with props null', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        filter: {
          target: null,
          relation: null
        }
      } as any;

      const result = await pipe.transform(resultInput);
      expect(result).toEqual(result);
    })
  });

  describe('Check include', () => {
    it('Should be incorrect with empty array', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        include: [],
        fields: null,
        filter: {
          target: null,
          relation: null
        }
      };
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'include').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be incorrect with incorrect relation', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        include: ['someRelation', 'otherReletion']
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'include').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be incorrect with incorrect type', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        include: [1, null, false]
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'include').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be incorrect with true', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        include: ['true']
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'include').length;
        expect(e.response.message.length).toBe(countError)
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be correct', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        include: ['addresses', 'manager']
      };

      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput);
    })

    it('Should be correct too', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        include: ['addresses']
      };

      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput);
    })
  })

  describe('Check sort', () => {
    it('Should be incorrect', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        sort: {
          targetResource: {
            other: 'DESC',
            columnName1: 'OTHER'
          },
          otherRelation: {},
          relationName2: {
            other: 'ASC',
            relationName1Field: 'OTHER'
          }
        }
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'sort').length;
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e.response.message.length).toBe(countError)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be incorrect empty object', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        sort: {}
      } as any;
      expect.assertions(3);
      try {
        await pipe.transform(resultInput)
      } catch (e) {
        const countError = e.response.message.filter(item => item.source.parameter.split('/')[1] === 'sort').length;
        expect(e.response.message.length).toBeGreaterThan(0)
        expect(e.response.message.length).toBe(countError)
        expect(e).toBeInstanceOf(BadRequestException)
      }
    })

    it('Should be correct with null', async () => {
      const resultInput: QueryParams<EntityClassOrSchema> = {
        ...resultInputMock,
        sort: null
      } as any;
      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput)

    })

    it('Should be correct with object', async () => {
      const resultInput: QueryParams<Users> = {
        ...resultInputMock,
        sort: {
          target: {
            isActive: 'ASC'
          },
          addresses: {
            state: 'DESC'
          }
        }
      };
      const result = await pipe.transform(resultInput);
      expect(result).toEqual(resultInput)

    })
  })
})
