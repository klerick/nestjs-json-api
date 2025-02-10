import { Test, TestingModule } from '@nestjs/testing';
import { MetadataStorage, MikroORM } from '@mikro-orm/core';

import {
  Users,
  Addresses,
  Notes,
  Roles,
  dbRandomName,
  mockDbPgLiteTestModule,
  Comments,
  UserGroups,
} from '../../../mock-utils/microrom';
import {
  CurrentMicroOrmProvider,
  CurrentEntityManager,
  CurrentEntityMetadata,
} from '../factory';

import { DEFAULT_ARRAY_TYPE, ENTITY_METADATA_TOKEN } from '../constants';

import { TypeField } from '../../mixin/types';

import {
  getProps,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelation,
  getRelationProperty,
} from './';

describe('microorm-orm-helper-for-map', () => {
  let entityMetadataToken: MetadataStorage;
  let mikroORM: MikroORM;
  let dbName: string;
  const config = DEFAULT_ARRAY_TYPE;
  beforeAll(async () => {
    dbName = dbRandomName(true);
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDbPgLiteTestModule(dbName)],
      providers: [
        CurrentMicroOrmProvider(),
        CurrentEntityManager(),
        CurrentEntityMetadata(),
      ],
    }).compile();

    entityMetadataToken = module.get(ENTITY_METADATA_TOKEN);

    mikroORM = module.get(MikroORM);
  });

  afterAll(() => {
    mikroORM.close(true);
  });

  it('getProps', () => {
    const result = getProps(entityMetadataToken.get(Users));
    expect(result.includes('id')).toBe(true);
    expect(result.includes('lastName')).toBe(true);
    expect(result.includes('createdAt')).toBe(true);
    expect(result.includes('updatedAt')).toBe(true);
    expect(result.includes('isActive')).toBe(true);
    expect(result.includes('login')).toBe(true);
    expect(result.includes('firstName')).toBe(true);
    expect(result.includes('testReal')).toBe(true);
    expect(result.includes('testArrayNull')).toBe(true);
    expect(result.includes('testDate')).toBe(true);

    expect(result.includes('userGroup' as any)).toBe(false);
    expect(result.includes('notes' as any)).toBe(false);
    expect(result.includes('comments' as any)).toBe(false);
    expect(result.includes('roles' as any)).toBe(false);
    expect(result.includes('manager' as any)).toBe(false);
    expect(result.includes('addresses' as any)).toBe(false);
  });

  it('getPropsType', () => {
    const result = getPropsType(entityMetadataToken.get(Users), config);

    expect(result).toEqual({
      createdAt: 'date',
      firstName: 'string',
      id: 'number',
      isActive: 'boolean',
      lastName: 'string',
      login: 'string',
      testArrayNull: 'array',
      testDate: 'date',
      testReal: 'array',
      updatedAt: 'date',
    });
  });

  it('getPropsNullable', () => {
    const result = getPropsNullable(entityMetadataToken.get(Users));
    expect(result).toEqual([
      'firstName',
      'testReal',
      'testArrayNull',
      'lastName',
      'isActive',
      'testDate',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('getPrimaryColumnName', () => {
    const result = getPrimaryColumnName(entityMetadataToken.get(Users));
    expect(result).toBe('id');
  });

  it('getPrimaryColumnType', () => {
    const result = getPrimaryColumnType(entityMetadataToken.get(Users));
    expect(result).toBe(TypeField.number);
  });

  it('getRelation', () => {
    const result = getRelation(entityMetadataToken.get(Users));
    expect(result.includes('id' as any)).toBe(false);
    expect(result.includes('lastName' as any)).toBe(false);
    expect(result.includes('createdAt' as any)).toBe(false);
    expect(result.includes('updatedAt' as any)).toBe(false);
    expect(result.includes('isActive' as any)).toBe(false);
    expect(result.includes('login' as any)).toBe(false);
    expect(result.includes('firstName' as any)).toBe(false);
    expect(result.includes('testReal' as any)).toBe(false);
    expect(result.includes('testArrayNull' as any)).toBe(false);
    expect(result.includes('testDate' as any)).toBe(false);

    expect(result.includes('userGroup')).toBe(true);
    expect(result.includes('notes')).toBe(true);
    expect(result.includes('comments')).toBe(true);
    expect(result.includes('roles')).toBe(true);
    expect(result.includes('manager')).toBe(true);
    expect(result.includes('addresses')).toBe(true);
  });

  it('getRelationProperty', () => {
    const result = getRelationProperty(entityMetadataToken.get(Users));
    expect(result).toEqual({
      addresses: {
        entityClass: Addresses,
        isArray: false,
        nullable: true,
      },
      comments: {
        entityClass: Comments,
        isArray: true,
        nullable: false,
      },
      manager: {
        entityClass: Users,
        isArray: false,
        nullable: true,
      },
      notes: {
        entityClass: Notes,
        isArray: true,
        nullable: false,
      },
      roles: {
        entityClass: Roles,
        isArray: true,
        nullable: false,
      },
      userGroup: {
        entityClass: UserGroups,
        isArray: false,
        nullable: true,
      },
    });
  });
});
