import { Repository } from 'typeorm';
import { TypeField } from '@klerick/json-api-nestjs';
import {
  getRepository,
  Users,
  Addresses,
  Notes,
  Comments,
  Roles,
  UserGroups,
  getModuleForPgLite,
  dbRandomName,
} from '../mock-utils';

import {
  getProps,
  getRelation,
  getPropsType,
  getPropsNullable,
  getPrimaryColumnName,
  getPrimaryColumnType,
  getRelationProperty,
  getArrayType,
} from './';

import { TypeormUtilsService } from '../service';

describe('typeorm-orm-helper-for-map', () => {
  const dbName = dbRandomName();
  let userRepository: Repository<Users>;
  beforeAll(async () => {
    const module = await getModuleForPgLite(Users, dbName, TypeormUtilsService);
    ({ userRepository } = getRepository(module));
  });

  it('getProps', () => {
    const result = getProps(userRepository);
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
    const result = getPropsType(userRepository);

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

  it('getArrayType', () => {
    const result = getArrayType(userRepository);
    expect(result).toEqual({
      testReal: TypeField.number,
      testArrayNull: TypeField.number,
    });
  });

  it('getPropsNullable', () => {
    const result = getPropsNullable(userRepository);
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
    const result = getPrimaryColumnName(userRepository);
    expect(result).toBe('id');
  });

  it('getPrimaryColumnType', () => {
    const result = getPrimaryColumnType(userRepository);
    expect(result).toBe(TypeField.number);
  });

  it('getRelation', () => {
    const result = getRelation(userRepository);
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
    const result = getRelationProperty(userRepository);
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
