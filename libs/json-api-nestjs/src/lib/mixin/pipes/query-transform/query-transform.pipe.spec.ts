import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {DataSource} from 'typeorm';

import {ajvFactory} from '../../../factory';
import {QueryTransformPipe} from './query-transform.pipe';
import {queryTransformMixin} from '../index';
import {Entity as EntityClassOrSchema, Fields, Includes, QueryField, QueryParams} from '../../../types';
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





describe('QueryTransformPipe', () => {
  let pipe: QueryTransformPipe<EntityClassOrSchema>;
  const defaultField = {
    needAttribute: false,
    page: {
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    },
    [QueryField.fields]: null,
    [QueryField.sort]: null,
    [QueryField.include]: null,
    [QueryField.filter]: {
      target: null,
      relation: null
    }
  }

  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const querySchemaMixinPip = queryTransformMixin(Users, mockConnectionName);

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

    pipe = module.get<QueryTransformPipe<EntityClassOrSchema>>(querySchemaMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should be empty object if query empty', async () => {
    const result = await pipe.transform(undefined);
    const emptyProps = Object.values(result).filter((value) => value !== null);

    expect(emptyProps.length).toEqual(3);
    expect(result['filter']).toEqual({ relation: null, target: null })
    expect(result['needAttribute']).toEqual(false);
    expect(result['page']).toEqual({
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    });
  })

  it('should be check "needAttribute"', async () => {
    const result = await pipe.transform({needAttribute: false});
    const emptyProps = Object.values(result).filter((value) => value !== null);
    expect(emptyProps.length).toEqual(3);
    expect(result['needAttribute']).toEqual(false);
    expect(result['page']).toEqual({
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    });

    const result1 = await pipe.transform({needAttribute: true});
    const emptyProps1 = Object.values(result1).filter((value) => value !== null);
    expect(emptyProps1.length).toEqual(3);
    expect(result1['needAttribute']).toEqual(true);
    expect(result1['page']).toEqual({
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    });
  });

  describe('Check transform filter object', () => {
    it('should check only target field', async () => {
      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.filter]: {
          relation: null,
          target: {
            someField: {
              eq: 'q',
              some: ['1', '2']
            },
            someField2: {
              in: ['1', '23', '3']
            },
            someField3: {
              eq: '1',
            }
          }
        }
      }

      const result = await pipe.transform({
        filter: {
          someField: {
            eq: 'q',
            some: '1,2'
          },
          someField2: {
            in: '1,23,3,'
          },
          emptyField: {},
          someField3: '1',
        }
      });

      expect(result).toEqual(resultCheck)
    });

    it('should check only relation object', async () => {
      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.filter]: {
          relation: {
            someRelation: {
              someField: {
                eq: 'q',
                some: ['1', '2']
              },
              someField2: {
                in: ['1', '23', '3']
              },
              someField3: {
                eq: '1',
              },
              someField4: {
                eq: '1',
              }
            },
            someRelation1: {
              someField: {
                like: 'q',
                lte: '1'
              },
            }
          },
          target: null
        }
      }

      const result = await pipe.transform({
        filter: {
          ['someRelation.someField']: {
            eq: 'q',
            some: '1,2'
          },
          ['someRelation.someField2']: {
            in: '1,23,3'
          },
          ['someRelation.someField3']: {
            eq: '1',
          },
          ['someRelation.someField4']: '1',
          ['someRelation.someField5']: {},
          ['someRelation1.someField']: {
            like: 'q',
            lte: '1'
          }
        }
      });

      expect(result).toEqual(resultCheck)
    });

    it('should check relation and target object', async () => {
      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.filter]: {
          relation: {
            someRelation: {
              someField: {
                eq: 'q',
                some: ['1', '2']
              },
              someField2: {
                in: ['1', '23', '3']
              },
              someField3: {
                eq: '1',
              },
              someField4: {
                eq: '1',
              }
            },
            someRelation1: {
              someField: {
                like: 'q',
                lte: '1'
              },
            }
          },
          target: {
            someField: {
              eq: 'q',
              some: ['1', '2']
            },
            someField2: {
              in: ['1', '23', '3']
            },
            someField3: {
              eq: '1',
            }
          }
        }
      }

      const result = await pipe.transform({
        filter: {
          ['someRelation.someField']: {
            eq: 'q',
            some: '1,2'
          },
          ['someRelation.someField2']: {
            in: '1,23,3'
          },
          ['someRelation.someField3']: {
            eq: '1',
          },
          ['someRelation.someField4']: '1',
          ['someRelation.someField5']: {},
          ['someRelation1.someField']: {
            like: 'q',
            lte: '1'
          },
          someField: {
            eq: 'q',
            some: '1,2'
          },
          someField2: {
            in: '1,23,3,'
          },
          emptyField: {},
          someField3: '1',
        }
      });

      expect(result).toEqual(resultCheck)
    });
  });

  describe('Check transform include object', () => {
    it('Should check string to array', async () => {

      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.include]: ['test','test2','test3','test4'] as Includes<EntityClassOrSchema>
      }

      const result = await pipe.transform({
        [QueryField.include]: 'test,test2 ,test3, test4,'
      });

      expect(result).toEqual(resultCheck)
    })
  });

  describe('Check transform field object', () => {
    it('Check transform fields object', async () => {
      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.fields]: {
          target: ['field1', 'field2', 'field3', 'field4'],
          someRelation: ['someRelationField1', 'someRelationField2', 'someRelationField3'],
          someRelation1: ['someRelation1Field1', 'someRelation1Field2', 'someRelation1Field3', 'someRelation1Field4']
        } as unknown as Fields<EntityClassOrSchema>
      }

      const result = await pipe.transform({
        [QueryField.fields]: {
          'target': 'field1,field2,field3,field4',
          'someRelation': 'someRelationField1,someRelationField2,someRelationField3, ',
          'someRelation1': 'someRelation1Field1,someRelation1Field2, someRelation1Field3,someRelation1Field4',
        }
      });

      expect(result).toEqual(resultCheck)
    });
  });

  describe('Check transform sort object', () => {
    it('Should check string to object', async () => {

      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.sort]: {
          target: {
            field1: 'ASC',
            field2: 'DESC',
            field3: 'ASC'
          },
          someRelation: {
            someRelationField1: 'DESC',
            someRelationField2: 'ASC'
          },
          someRelation1: {
            someRelation1Field1: 'ASC'
          }
        } as unknown as Fields<EntityClassOrSchema>
      }

      const result = await pipe.transform({
        [QueryField.sort]: 'field1,-field2,field3,, -someRelation.someRelationField1,someRelation.someRelationField2,someRelation1.someRelation1Field1'
      });

      expect(result).toEqual(resultCheck)
    });
  });

  describe('Check transform page object', () => {
    it('Check transform page', async () => {
      const resultCheck: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.page]: {
          number: 10,
          size: defaultField.page.size
        }
      }

      const result = await pipe.transform({
        [QueryField.page]: {
          number: '10',
          size: 'sdf'
        }
      });
      expect(result).toEqual(resultCheck)
      const resultCheck1: QueryParams<EntityClassOrSchema> = {
        ...defaultField,
        [QueryField.page]: {
          number: 10,
          size: 5
        }
      }

      const result1 = await pipe.transform({
        [QueryField.page]: {
          number: '10',
          size: '5'
        }
      });

      expect(result1).toEqual(resultCheck1)
    })
  })
})
