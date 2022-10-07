import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { entities, mockDBTestModule, Users } from '../../../mock-utils';
import {
  DEFAULT_CONNECTION_NAME,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import { ParseRelationshipNamePipe } from './parse-relationship-name.pipe';
import { ajvFactory } from '../../../factory';
import { parseRelationshipNameMixin } from '../index';

describe('ParseRelationshipNamePipe', () => {
  let pipe: ParseRelationshipNamePipe<Users>;
  const mockConnectionName = DEFAULT_CONNECTION_NAME;
  const parseRelationshipNameMixinPip = parseRelationshipNameMixin(
    Users,
    mockConnectionName
  );

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        parseRelationshipNameMixinPip,
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

    pipe = module.get<ParseRelationshipNamePipe<Users>>(
      parseRelationshipNameMixinPip
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be error', async () => {
    try {
      await pipe.transform('rereerer');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.response.message[0].detail).toBe(
        "Relation 'rereerer' does not exist in resource 'users'"
      );
      expect(e.response.message.length).toBeGreaterThan(0);
    }
  });

  it('Should be ok', async () => {
    const result = await pipe.transform('addresses');
    expect(result).toBe('addresses');
  });
});
