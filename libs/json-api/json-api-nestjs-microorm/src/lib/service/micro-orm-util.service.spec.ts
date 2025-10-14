import { MikroORM, RawQueryFragment } from '@mikro-orm/core';
import { FilterOperand } from '@klerick/json-api-nestjs-shared';
import { TestingModule } from '@nestjs/testing/testing-module';

import { MicroOrmUtilService } from './micro-orm-util.service';

import {
  dbRandomName,
  getDefaultQuery,
  getModuleForPgLite,
  Roles,
  UserGroups,
  Users,
} from '../mock-utils';

describe('MicroOrmUtilService', () => {
  let mikroORMUserGroup: MikroORM;
  let mikroORMUsers: MikroORM;
  let mikroORMRoles: MikroORM;
  let microOrmUtilsServiceUserGroups: MicroOrmUtilService<UserGroups>;
  let microOrmUtilsServiceUsers: MicroOrmUtilService<Users>;
  let microOrmUtilsServiceRoles: MicroOrmUtilService<Roles>;
  let moduleRoles: TestingModule;
  let moduleUsers: TestingModule;
  let moduleUserGroup: TestingModule;

  let dbName: string;

  beforeAll(async () => {
    dbName = dbRandomName(true);
    moduleUserGroup = await getModuleForPgLite(UserGroups, dbName);

    microOrmUtilsServiceUserGroups =
      moduleUserGroup.get<MicroOrmUtilService<UserGroups>>(MicroOrmUtilService);
    mikroORMUserGroup = moduleUserGroup.get(MikroORM);

    moduleUsers = await getModuleForPgLite(Users, dbName);
    microOrmUtilsServiceUsers =
      moduleUsers.get<MicroOrmUtilService<Users>>(MicroOrmUtilService);

    mikroORMUsers = moduleUsers.get(MikroORM);

    moduleRoles = await getModuleForPgLite(Roles, dbName);
    microOrmUtilsServiceRoles =
      moduleRoles.get<MicroOrmUtilService<Roles>>(MicroOrmUtilService);
    mikroORMRoles = moduleRoles.get(MikroORM);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await mikroORMUserGroup.close(true);
    await mikroORMUsers.close(true);
    await mikroORMRoles.close(true);
  });

  it('currentAlias', () => {
    expect(microOrmUtilsServiceUserGroups.currentAlias).toBe('UserGroups');
  });

  it('currentPrimaryColumn', () => {
    expect(microOrmUtilsServiceUserGroups.currentPrimaryColumn).toBe('id');
  });

  it('getAliasForEntity relation', () => {
    expect(() =>
      microOrmUtilsServiceUsers.getAliasForPivotTable(Users, 'login')
    ).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining('relation not found'),
      })
    );

    expect(() =>
      microOrmUtilsServiceUsers.getAliasForPivotTable(Users, 'notes')
    ).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining('Many to many relation expected'),
      })
    );

    expect(
      microOrmUtilsServiceUsers.getAliasForPivotTable(Users, 'roles')
    ).toBe('users_have_roles');
  });

  it('queryBuilder', () => {
    const resultUserGroups = microOrmUtilsServiceUserGroups.queryBuilder();
    expect(resultUserGroups.mainAlias.aliasName).toBe('UserGroups');
    expect(resultUserGroups.mainAlias.entityName).toBe('UserGroups');

    const resultUsers = microOrmUtilsServiceUserGroups.queryBuilder(Users);
    expect(resultUsers.mainAlias.aliasName).toBe('Users');
    expect(resultUsers.mainAlias.entityName).toBe('Users');

    const resultTestUsersAlias = microOrmUtilsServiceUserGroups.queryBuilder(
      Users,
      'TestUsers'
    );
    expect(resultTestUsersAlias.mainAlias.entityName).toBe('Users');
    expect(resultTestUsersAlias.mainAlias.aliasName).toBe('TestUsers');

    const resultTestUsersOnlyAlias =
      microOrmUtilsServiceUserGroups.queryBuilder('TestUserGroups');
    expect(resultTestUsersOnlyAlias.mainAlias.entityName).toBe('UserGroups');
    expect(resultTestUsersOnlyAlias.mainAlias.aliasName).toBe('TestUserGroups');
  });

  it('defaultOrder', () => {
    expect(microOrmUtilsServiceUserGroups.defaultOrder).toEqual({ id: 'ASC' });
  });
  describe('getFilterExpressionForTarget', () => {
    it('expression for target field, target is null, should be null expression array', () => {
      const query = getDefaultQuery<Users>();
      const result =
        microOrmUtilsServiceUsers.getFilterExpressionForTarget<Users>(query);

      expect(result).toEqual([]);
    });
    it('expression for target field with target field', async () => {
      const nullableField = 'id';
      const nullableFieldValue = null;
      const notNullableField = 'login';
      const notNullableFieldValue = null;
      const regexpField = 'firstName';
      const regexpFieldValue = 'firstName';

      const otherFiled = 'lastName';
      const otherFiledValue1: [string, string, string] = ['1', '3', '4'];
      const otherFiledValue2 = 'test';
      const otherFiledValue3 = 'test2';

      const arrayField = 'testReal';
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        [nullableField]: {
          [FilterOperand.eq]: nullableFieldValue,
        },
        [notNullableField]: {
          [FilterOperand.ne]: notNullableFieldValue,
        },
        [regexpField]: {
          [FilterOperand.regexp]: regexpFieldValue,
        },
        [otherFiled]: {
          [FilterOperand.in]: otherFiledValue1,
          [FilterOperand.nin]: otherFiledValue1,
          [FilterOperand.like]: otherFiledValue2,
          [FilterOperand.gt]: otherFiledValue3,
        },
        [arrayField]: {
          [FilterOperand.some]: otherFiledValue1,
        },
      } as any;

      const [
        id,
        login,
        regexpFieldConditional,
        otherFiledConditional,
        arrayFieldConditional,
      ] = microOrmUtilsServiceUsers.getFilterExpressionForTarget(query);

      expect(id).toEqual({
        [nullableField]: {
          ['$' + FilterOperand.eq]: nullableFieldValue,
        },
      });

      expect(login).toEqual({
        [notNullableField]: {
          ['$' + FilterOperand.ne]: notNullableFieldValue,
        },
      });

      expect(regexpFieldConditional).toEqual({
        [regexpField]: {
          ['$re']: regexpFieldValue,
        },
      });
      expect(otherFiledConditional).toEqual({
        [otherFiled]: {
          ['$' + FilterOperand.in]: otherFiledValue1,
          ['$' + FilterOperand.nin]: otherFiledValue1,
          ['$ilike']: `%${otherFiledValue2}%`,
          ['$' + FilterOperand.gt]: otherFiledValue3,
        },
      });
      expect(arrayFieldConditional).toEqual({
        [arrayField]: {
          ['$overlap']: otherFiledValue1,
        },
      });
    });

    it('expression for target field with relation field not exist', async () => {
      const oneToOneToMyself = 'manager';
      const oneToOneToOther = 'addresses';
      const manyToMany = 'roles';
      const oneToMany = 'comments';
      const manyToOne = 'userGroup';

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        [oneToOneToMyself]: {
          [FilterOperand.eq]: 'null',
        },
        [oneToOneToOther]: {
          [FilterOperand.eq]: 'null',
        },
        [manyToMany]: {
          [FilterOperand.eq]: 'null',
        },
        [oneToMany]: {
          [FilterOperand.eq]: 'null',
        },
        [manyToOne]: {
          [FilterOperand.eq]: 'null',
        },
      };

      const [
        oneToOneToMyselfEq,
        oneToOneToOtherEq,
        manyToManyEq,
        oneToManyEq,
        manyToOneEq,
      ] = microOrmUtilsServiceUsers.getFilterExpressionForTarget(query);

      expect(oneToOneToMyselfEq).toEqual({
        [oneToOneToMyself]: { $exists: false },
      });
      expect(oneToOneToOtherEq).toEqual({
        [oneToOneToOther]: { $exists: false },
      });
      expect(manyToOneEq).toEqual({ [manyToOne]: { $exists: false } });
      expect(manyToManyEq).toBeInstanceOf(RawQueryFragment);
      expect(oneToManyEq).toBeInstanceOf(RawQueryFragment);
      if (!(oneToManyEq instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');
      if (!(manyToManyEq instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');

      expect(manyToManyEq.sql).toBe(
        'not exists (select 1 from "public"."users_have_roles" as "users_have_roles" where "users_have_roles"."user_id" = "Users"."id")'
      );
      expect(oneToManyEq.sql).toBe(
        'not exists (select 1 from "public"."comments" as "Comments" where "Comments"."created_by" = "Users"."id")'
      );
    });
    it('expression for target field with relation field exist', async () => {
      const oneToOneToMyself = 'manager';
      const oneToOneToOther = 'addresses';
      const manyToMany = 'roles';
      const oneToMany = 'comments';
      const manyToOne = 'userGroup';

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        [oneToOneToMyself]: {
          [FilterOperand.ne]: 'null',
        },
        [oneToOneToOther]: {
          [FilterOperand.ne]: 'null',
        },
        [manyToMany]: {
          [FilterOperand.ne]: 'null',
        },
        [oneToMany]: {
          [FilterOperand.ne]: 'null',
        },
        [manyToOne]: {
          [FilterOperand.ne]: 'null',
        },
      };

      const [
        oneToOneToMyselfNe,
        oneToOneToOtherNe,
        manyToManyNe,
        oneToManyNe,
        manyToOneNe,
      ] = microOrmUtilsServiceUsers.getFilterExpressionForTarget(query);

      expect(oneToOneToMyselfNe).toEqual({
        [oneToOneToMyself]: { $exists: true },
      });
      expect(oneToOneToOtherNe).toEqual({
        [oneToOneToOther]: { $exists: true },
      });
      expect(manyToOneNe).toEqual({ [manyToOne]: { $exists: true } });
      expect(manyToManyNe).toBeInstanceOf(RawQueryFragment);
      expect(oneToManyNe).toBeInstanceOf(RawQueryFragment);
      if (!(oneToManyNe instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');
      if (!(manyToManyNe instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');

      expect(manyToManyNe.sql).toBe(
        'exists (select 1 from "public"."users_have_roles" as "users_have_roles" where "users_have_roles"."user_id" = "Users"."id")'
      );
      expect(oneToManyNe.sql).toBe(
        'exists (select 1 from "public"."comments" as "Comments" where "Comments"."created_by" = "Users"."id")'
      );
    });

    it('expression for target field with relation field exist with sort and include', async () => {
      const oneToOneToMyself = 'manager';
      const oneToOneToOther = 'addresses';
      const manyToMany = 'roles';
      const oneToMany = 'comments';
      const manyToOne = 'userGroup';

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        [oneToOneToMyself]: {
          [FilterOperand.ne]: 'null',
        },
        [oneToOneToOther]: {
          [FilterOperand.ne]: 'null',
        },
        [manyToMany]: {
          [FilterOperand.ne]: 'null',
        },
        [oneToMany]: {
          [FilterOperand.ne]: 'null',
        },
        [manyToOne]: {
          [FilterOperand.ne]: 'null',
        },
      };

      query.sort = {
        [manyToMany]: { key: 'ASC' },
      };
      query.include = [oneToMany];

      const [
        oneToOneToMyselfNe,
        oneToOneToOtherNe,
        manyToManyNe,
        oneToManyNe,
        manyToOneNe,
      ] = microOrmUtilsServiceUsers.getFilterExpressionForTarget(query);

      expect(oneToOneToMyselfNe).toEqual({
        [oneToOneToMyself]: { $exists: true },
      });
      expect(oneToOneToOtherNe).toEqual({
        [oneToOneToOther]: { $exists: true },
      });
      expect(manyToOneNe).toEqual({ [manyToOne]: { $exists: true } });
      expect(manyToManyNe).toEqual({ roles: { $exists: true } });
      expect(oneToManyNe).toEqual({ comments: { $exists: true } });
    });
  });

  describe('getFilterExpressionForRelation', () => {
    it('expression for relation field OneToMany and ManyToOne', async () => {
      const query = getDefaultQuery<Users>();

      query.filter.relation = {
        comments: {
          kind: {
            [FilterOperand.eq]: 'test',
          },
        },
        userGroup: {
          label: {
            [FilterOperand.eq]: 'test',
          },
        },
      } as any;

      const [comments, userGroup] =
        microOrmUtilsServiceUsers.getFilterExpressionForRelation(query);

      if (!(userGroup instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');

      expect(userGroup.sql).toBe(
        `exists (select 1 from "public"."user_groups" as "UserGroups" where "UserGroups"."id" = "Users"."user_groups_id" and "UserGroups"."label" = 'test')`
      );

      if (!(comments instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');

      expect(comments.sql).toBe(
        `exists (select 1 from "public"."comments" as "Comments" where "Comments"."created_by" = "Users"."id" and "Comments"."kind" = 'test')`
      );
    });

    it('expression for relation field OneToMany and ManyToOne with sort', async () => {
      const query = getDefaultQuery<Users>();
      query.sort = {
        userGroup: {
          label: 'ASC',
        },
        comments: {
          kind: 'ASC',
        },
      };
      query.filter.relation = {
        comments: {
          kind: {
            [FilterOperand.eq]: 'test',
          },
        },
        userGroup: {
          label: {
            [FilterOperand.eq]: 'test',
          },
        },
      } as any;

      const [comments, userGroup] =
        microOrmUtilsServiceUsers.getFilterExpressionForRelation(query);

      expect(userGroup).toEqual({ userGroup: { label: { $eq: 'test' } } });

      expect(comments).toEqual({ comments: { kind: { $eq: 'test' } } });
    });

    it('expression for relation field OneToOne', async () => {
      const query = getDefaultQuery<Users>();

      query.filter.relation = {
        manager: {
          login: {
            [FilterOperand.eq]: 'test',
          },
        },
        addresses: {
          city: {
            [FilterOperand.eq]: 'test',
          },
        },
      };
      const [manager, addresses] =
        microOrmUtilsServiceUsers.getFilterExpressionForRelation(query);
      expect(manager).toEqual({ manager: { login: { $eq: 'test' } } });
      expect(addresses).toEqual({ addresses: { city: { $eq: 'test' } } });
    });

    it('expression for relation field ManyToMany', async () => {
      const query = getDefaultQuery<Users>();
      const queryRoles = getDefaultQuery<Roles>();

      query.filter.relation = {
        roles: {
          key: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isDefault: {
            [FilterOperand.eq]: 'false',
          },
        },
      };

      queryRoles.filter.relation = {
        users: {
          login: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isActive: {
            [FilterOperand.eq]: 'false',
          },
        },
      };

      const [roles] =
        microOrmUtilsServiceUsers.getFilterExpressionForRelation(query);

      if (!(roles instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');

      expect(roles.sql).toBe(
        `exists (select 1 from "public"."users_have_roles" as "users_have_roles" left join "public"."roles" as "r1" on "users_have_roles"."role_id" = "r1"."id" where "users_have_roles"."user_id" = "Users"."id" and "r1"."key" = 'test' and "r1"."key" != 'test2' and "r1"."is_default" = 'false')`
      );

      const [users] =
        microOrmUtilsServiceRoles.getFilterExpressionForRelation(queryRoles);

      if (!(users instanceof RawQueryFragment))
        throw new Error('Is not RawQueryFragment');
      expect(users.sql).toBe(
        `exists (select 1 from "public"."users_have_roles" as "users_have_roles" left join "public"."users" as "u1" on "users_have_roles"."user_id" = "u1"."id" where "users_have_roles"."role_id" = "Roles"."id" and "u1"."login" = 'test' and "u1"."login" != 'test2' and "u1"."is_active" = 'false')`
      );
    });

    it('expression for relation field ManyToMany with sort', async () => {
      const query = getDefaultQuery<Users>();
      const queryRoles = getDefaultQuery<Roles>();

      query.filter.relation = {
        roles: {
          key: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isDefault: {
            [FilterOperand.eq]: 'false',
          },
        },
      };
      query.sort = {
        roles: { key: 'ASC' },
      };

      queryRoles.filter.relation = {
        users: {
          login: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isActive: {
            [FilterOperand.eq]: 'false',
          },
        },
      };

      queryRoles.sort = {
        users: { login: 'ASC' },
      };

      const [roles] =
        microOrmUtilsServiceUsers.getFilterExpressionForRelation(query);

      expect(roles).toEqual({
        roles: {
          isDefault: { $eq: 'false' },
          key: { $eq: 'test', $ne: 'test2' },
        },
      });

      const [users] =
        microOrmUtilsServiceRoles.getFilterExpressionForRelation(queryRoles);

      expect(users).toEqual({
        users: {
          isActive: { $eq: 'false' },
          login: { $eq: 'test', $ne: 'test2' },
        },
      });
    });

    it('getConditionalForJoin', () => {
      const query = getDefaultQuery<Users>();
      query.filter.relation = {
        roles: {
          key: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
        },
      };
      const result = microOrmUtilsServiceRoles.getConditionalForJoin<Users>(
        query,
        'roles'
      );
      expect(result).toEqual({
        key: { $eq: 'test', $ne: 'test2' },
      });
    });
  });
});
