import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { IMemoryDb } from 'pg-mem';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  Users,
} from '../../../mock-utils';
import { ParseRelationshipNamePipe } from './parse-relationship-name.pipe';
import { TypeormUtilsService } from '../../service/typeorm-utils.service';

import {
  CurrentDataSourceProvider,
  EntityRepositoryFactory,
} from '../../../factory';
import { DEFAULT_CONNECTION_NAME } from '../../../constants';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ParseRelationshipNamePipe', () => {
  let db: IMemoryDb;
  let parseRelationshipNamePipe: ParseRelationshipNamePipe<Users>;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        EntityRepositoryFactory(Users),
        TypeormUtilsService,
        ParseRelationshipNamePipe,
      ],
    }).compile();

    parseRelationshipNamePipe = module.get<ParseRelationshipNamePipe<Users>>(
      ParseRelationshipNamePipe
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be correct', async () => {
    const relName = 'userGroup';
    const result = await parseRelationshipNamePipe.transform(relName);
    expect(result).toBe(relName);
  });

  it('Should be error', async () => {
    expect.assertions(1);
    try {
      await parseRelationshipNamePipe.transform('11111');
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
    }
  });
});
