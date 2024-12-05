import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { getDataSourceToken } from '@nestjs/typeorm';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
  UserGroups,
  Users,
} from '../mock-utils';
import { CurrentDataSourceProvider } from '../factory';
import { DEFAULT_CONNECTION_NAME } from '../constants';
import { EntityPropsMapService } from './entity-props-map.service';

describe('EntityPropsMapService', () => {
  let db: IMemoryDb;
  let entityPropsMapService: EntityPropsMapService;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        EntityPropsMapService,
      ],
    }).compile();

    entityPropsMapService = module.get<EntityPropsMapService>(
      EntityPropsMapService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('getPropsForEntity', () => {
    const result = entityPropsMapService.getRelPropsForEntity(Users);
    expect(result).toEqual([
      'addresses',
      'manager',
      'roles',
      'comments',
      'notes',
      'userGroup',
    ]);
  });

  it('getPropsForEntity', () => {
    const result = entityPropsMapService.getPropsForEntity(Users);
    expect(result).toEqual([
      'id',
      'login',
      'firstName',
      'testReal',
      'testArrayNull',
      'lastName',
      'isActive',
      'createdAt',
      'testDate',
      'updatedAt',
    ]);
  });

  it('getPrimaryColumnsForEntity', () => {
    expect(entityPropsMapService.getPrimaryColumnsForEntity(Users)).toBe('id');
  });

  it('getNameForEntity', () => {
    expect(entityPropsMapService.getNameForEntity(Users)).toBe('Users');
    expect(entityPropsMapService.getNameForEntity(UserGroups)).toBe(
      'UserGroups'
    );
  });

  it('getRelationPropsType', () => {
    expect(
      entityPropsMapService.getRelationPropsType(Users, 'userGroup' as any)
    ).toEqual(UserGroups);
  });
});
