import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { QuerySchemaPipe } from './query-schema.pipe';
import { ajvFactory } from '../../../factory';

import { querySchemaMixin } from '../';
import { QuerySchemaTypes } from '../../../types';
import { mockDBTestModule, entities, Users } from '../../../mock-utils';
import {
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';

describe('QuerySchema', () => {
  let pipe: QuerySchemaPipe;
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const querySchemaMixinPip = querySchemaMixin(Users, mockConnectionName);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        querySchemaMixinPip,
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

    pipe = module.get<QuerySchemaPipe>(querySchemaMixinPip);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('empty object should be correct', async () => {
    const result = await pipe.transform({});
    expect(result).toEqual({});
  });

  it('should be correct if have some correct props', async () => {
    const query = {
      include: `addresses,manager`,
    };
    const result = await pipe.transform(query);
    expect(result).toEqual(query);
  });

  describe('Check "fields" props', () => {
    it('should be correct', async () => {
      const query: QuerySchemaTypes = {
        fields: {
          addresses: 'some,string',
        },
      };
      const query1: QuerySchemaTypes = {
        fields: {
          target: 'some,string',
        },
      };
      const query2: QuerySchemaTypes = {
        fields: {},
      };

      const result = await pipe.transform(query);
      const result1 = await pipe.transform(query1);
      const result2 = await pipe.transform(query2);
      expect(result).toEqual(query);
      expect(result1).toEqual(query1);
      expect(result2).toEqual(query2);
    });

    it('should be incorrect', async () => {
      const query: QuerySchemaTypes = {
        fields: {
          inccorect: 'some,string',
        },
      };
      expect.assertions(1);
      try {
        await pipe.transform(query);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should be incorrect Exclude props', async () => {
      const query: QuerySchemaTypes = {
        fields: {
          lastName: 'some,string',
        },
      };
      expect.assertions(1);
      try {
        await pipe.transform(query);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Check "filter" props', () => {
    it('should be correct without operand', async () => {
      const query: QuerySchemaTypes = {
        filter: {
          isActive: '2',
        },
      };
      const result = await pipe.transform(query);
      expect(result).toEqual(query);
    });

    it('should be correct', async () => {
      const query: QuerySchemaTypes = {
        filter: {
          isActive: {
            eq: '2',
          },
        },
      };
      const query1: QuerySchemaTypes = { filter: {} };
      const query2: QuerySchemaTypes = {
        filter: {
          ['addresses.city']: {
            eq: '2',
          },
          ['manager.isActive']: '2',
          isActive: {
            in: '2,1',
          },
        },
      };

      const query3: QuerySchemaTypes = {
        filter: {
          ['addresses']: 'null',
        },
      };

      const query4: QuerySchemaTypes = {
        filter: {
          ['addresses']: { eq: 'null' },
        },
      };

      const result = await pipe.transform(query);
      const result1 = await pipe.transform(query1);
      const result2 = await pipe.transform(query2);
      const result3 = await pipe.transform(query3);
      const result4 = await pipe.transform(query4);

      expect(result).toEqual(query);
      expect(result1).toEqual(query1);
      expect(result2).toEqual(query2);
      expect(result3).toEqual(query3);
      expect(result4).toEqual(query4);
    });

    it('should be incorrect', async () => {
      expect.assertions(3);
      const query = {
        filter: {
          inccorect: 'some,string',
          columnName1: 'sdasdad',
        },
      };
      try {
        await pipe.transform(query);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }

      const query2 = {
        filter: {
          columnName1: { test: 'sd' },
        },
      };
      try {
        await pipe.transform(query2);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }

      const query3 = {
        filter: {
          mockEntity3: { in: 'sd' },
        },
      };
      try {
        await pipe.transform(query3);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Check "include" props', () => {
    it('should be correct', async () => {
      const query: QuerySchemaTypes = {
        include: 'addresses',
      };

      const result = await pipe.transform(query);
      expect(result).toEqual(query);
    });

    it('should be incorrect', async () => {
      const query: QuerySchemaTypes = {
        include: '',
      };

      expect.assertions(1);
      try {
        await pipe.transform(query);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Check "sort" props', () => {
    it('should be correct', async () => {
      const query: QuerySchemaTypes = {
        sort: '',
      };

      const result = await pipe.transform(query);
      expect(result).toEqual(query);
    });

    it('should be incorrect', async () => {
      const query = {
        sort: {},
      };

      expect.assertions(1);
      try {
        await pipe.transform(query);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('Check "page" props', () => {
    it('should be correct', async () => {
      const query: QuerySchemaTypes = {
        page: {
          number: 'dsf',
          size: 'sdf',
        },
      };

      const query1: QuerySchemaTypes = {
        page: {
          size: 'sdf',
        },
      };

      const query2: QuerySchemaTypes = {
        page: {},
      };

      const result = await pipe.transform(query);
      const result1 = await pipe.transform(query1);
      const result2 = await pipe.transform(query2);
      expect(result).toEqual(query);
      expect(result1).toEqual(query1);
      expect(result2).toEqual(query2);
    });
  });

  it('should be incorrect', async () => {
    const query = {
      page: {
        limit: 'dsfsdf',
      },
    };

    const query2 = {
      page: {
        test: 1,
      },
    };

    expect.assertions(2);
    try {
      await pipe.transform(query);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }

    try {
      await pipe.transform(query2);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });
});
