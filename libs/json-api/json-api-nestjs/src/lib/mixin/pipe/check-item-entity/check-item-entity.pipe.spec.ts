import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { IMemoryDb } from 'pg-mem';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  pullUser,
  Users,
} from '../../../mock-utils';
import { CheckItemEntityPipe } from './check-item-entity.pipe';
import { TypeormUtilsService } from '../../../service';

import {
  CurrentDataSourceProvider,
  EntityRepositoryFactory,
} from '../../../factory';
import {
  CURRENT_ENTITY_REPOSITORY,
  DEFAULT_CONNECTION_NAME,
} from '../../../constants';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CheckItemEntityPipe', () => {
  let db: IMemoryDb;
  let checkItemEntityPipe: CheckItemEntityPipe<Users>;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        EntityRepositoryFactory(Users),
        TypeormUtilsService,
        CheckItemEntityPipe,
      ],
    }).compile();

    await pullUser(module.get<Repository<Users>>(CURRENT_ENTITY_REPOSITORY));

    checkItemEntityPipe =
      module.get<CheckItemEntityPipe<Users>>(CheckItemEntityPipe);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be correct', async () => {
    const id = 1;
    const result = await checkItemEntityPipe.transform(id);
    expect(result).toBe(id);
  });

  it('Should be error', async () => {
    expect.assertions(1);
    try {
      await checkItemEntityPipe.transform(11111);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
    }
  });
});
