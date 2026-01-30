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
} from '../mock-utils';
import {
  CurrentMicroOrmProvider,
  CurrentEntityManager,
  CurrentEntityMetadata,
} from '../factory';

import { DEFAULT_ARRAY_TYPE, ENTITY_METADATA_TOKEN } from '../constants';

import { TypeField } from '@klerick/json-api-nestjs';

import {
  getProps,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelation,
  getRelationProperty,
  getArrayType,
  getRelationFkField,
} from './index';

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
    const namingStrategy = mikroORM.config.getNamingStrategy();
    const result = getProps(entityMetadataToken.get(Users), namingStrategy);
    expect(result.includes('id' as any)).toBe(false);
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

  it('getProps - without RelationFkField', () => {
    const namingStrategy = mikroORM.config.getNamingStrategy();
    const result = getProps(entityMetadataToken.get(Notes), namingStrategy);
    expect(result.includes('id' as any)).toBe(false);
    expect(result.includes('text')).toBe(true);
    expect(result.includes('createdAt')).toBe(true);
    expect(result.includes('updatedAt')).toBe(true);

    expect(result.includes('createdBy' as any)).toBe(false);
    expect(result.includes('createdById' as any)).toBe(false);
  });

  it('getPropsType', () => {
    const namingStrategy = mikroORM.config.getNamingStrategy();
    const result = getPropsType(entityMetadataToken.get(Users), namingStrategy, config);

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
    const namingStrategy = mikroORM.config.getNamingStrategy();
    const result = getPropsNullable(entityMetadataToken.get(Users), namingStrategy);
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

  it('getArrayType', () => {
    const namingStrategy = mikroORM.config.getNamingStrategy();
    const result = getArrayType(entityMetadataToken.get(Users), namingStrategy);
    expect(result).toEqual({
      testReal: TypeField.number,
      testArrayNull: TypeField.number,
    });
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

  it('getRelationFkField', () => {

    const namingStrategy = mikroORM.config.getNamingStrategy();

    const notesResult = getRelationFkField(
      entityMetadataToken.get(Notes),
      namingStrategy
    );

    expect(notesResult).toEqual({
      createdBy: 'createdById',
    });

    const usersResult = getRelationFkField(
      entityMetadataToken.get(Users),
      namingStrategy
    );
    expect(usersResult).toEqual({});
  });
});
