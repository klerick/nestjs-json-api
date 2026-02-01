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

  describe('updateEntity', () => {
    let dbNameForUpdate: string;
    let moduleForUpdate: TestingModule;
    let mikroORMForUpdate: MikroORM;
    let microOrmUtilServiceForUpdate: MicroOrmUtilService<Users>;

    beforeAll(async () => {
      dbNameForUpdate = dbRandomName();
      moduleForUpdate = await getModuleForPgLite(Users, dbNameForUpdate);
      microOrmUtilServiceForUpdate =
        moduleForUpdate.get<MicroOrmUtilService<Users>>(MicroOrmUtilService);
      mikroORMForUpdate = moduleForUpdate.get(MikroORM);
    });

    afterAll(async () => {
      await mikroORMForUpdate.close(true);
    });

    const createTestUser = (
      em: MicroOrmUtilService<Users>['entityManager'],
      login: string
    ) => {
      return em.create(
        Users,
        {
          login,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          testDate: new Date(),
          testReal: [],
        },
        { partial: true }
      );
    };

    const createTestRole = (
      em: MicroOrmUtilService<Users>['entityManager'],
      key: string,
      name: string
    ) => {
      return em.create(
        Roles,
        { key, name, isDefault: false },
        { partial: true }
      );
    };

    it('should only remove roles not in new list and add only new roles (diff-based update)', async () => {
      const em = microOrmUtilServiceForUpdate.entityManager;

      // Create user with initial roles
      const user = createTestUser(em, 'test-user-update');

      const role1 = createTestRole(em, 'role-1', 'Role 1');
      const role2 = createTestRole(em, 'role-2', 'Role 2');
      const role3 = createTestRole(em, 'role-3', 'Role 3');
      const role4 = createTestRole(em, 'role-4', 'Role 4');

      user.roles.add(role1, role2, role3);

      await em.persistAndFlush([user, role1, role2, role3, role4]);
      em.clear();

      // Load user with roles
      const loadedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      // Verify initial state: roles 1, 2, 3
      const initialRoleIds = loadedUser.roles
        .getItems()
        .map((r) => r.id)
        .sort();
      expect(initialRoleIds).toEqual([role1.id, role2.id, role3.id].sort());

      // Update: keep role2, role3, add role4, remove role1
      // New roles: [role2, role3, role4]
      const newRolesData = await em.find(Roles, {
        id: { $in: [role2.id, role3.id, role4.id] },
      });

      await microOrmUtilServiceForUpdate.updateEntity(loadedUser, {
        roles: {
          data: newRolesData.map((r) => ({ type: 'roles', id: String(r.id) })),
        },
      } as Parameters<typeof microOrmUtilServiceForUpdate.updateEntity>[1]);

      em.clear();

      // Verify final state
      const updatedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      const finalRoleIds = updatedUser.roles
        .getItems()
        .map((r) => r.id)
        .sort();
      expect(finalRoleIds).toEqual([role2.id, role3.id, role4.id].sort());

      // Verify role1 still exists in DB (not deleted, just unlinked)
      const role1StillExists = await em.findOne(Roles, { id: role1.id });
      expect(role1StillExists).not.toBeNull();
    });

    it('should not touch existing relationships when same data is sent', async () => {
      const em = microOrmUtilServiceForUpdate.entityManager;

      // Create user with roles
      const user = createTestUser(em, 'test-user-same-data');

      const roleA = createTestRole(em, 'role-a', 'Role A');
      const roleB = createTestRole(em, 'role-b', 'Role B');

      user.roles.add(roleA, roleB);

      await em.persistAndFlush([user, roleA, roleB]);
      em.clear();

      // Load user with roles
      const loadedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      // Send the same roles again
      const sameRolesData = await em.find(Roles, {
        id: { $in: [roleA.id, roleB.id] },
      });

      // Spy on collection methods to verify no unnecessary operations
      const removeSpy = vi.spyOn(loadedUser.roles, 'remove');
      const addSpy = vi.spyOn(loadedUser.roles, 'add');

      await microOrmUtilServiceForUpdate.updateEntity(loadedUser, {
        roles: {
          data: sameRolesData.map((r) => ({ type: 'roles', id: String(r.id) })),
        },
      } as Parameters<typeof microOrmUtilServiceForUpdate.updateEntity>[1]);

      // Neither remove nor add should be called since data is the same
      expect(removeSpy).not.toHaveBeenCalled();
      expect(addSpy).not.toHaveBeenCalled();

      em.clear();

      // Verify state unchanged
      const unchangedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      const roleIds = unchangedUser.roles
        .getItems()
        .map((r) => r.id)
        .sort();
      expect(roleIds).toEqual([roleA.id, roleB.id].sort());
    });

    it('should handle empty new relationships (remove all)', async () => {
      const em = microOrmUtilServiceForUpdate.entityManager;

      // Create user with roles
      const user = createTestUser(em, 'test-user-empty');

      const roleX = createTestRole(em, 'role-x', 'Role X');
      const roleY = createTestRole(em, 'role-y', 'Role Y');

      user.roles.add(roleX, roleY);

      await em.persistAndFlush([user, roleX, roleY]);
      em.clear();

      // Load user with roles
      const loadedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      // Send empty array - should remove all roles
      await microOrmUtilServiceForUpdate.updateEntity(loadedUser, {
        roles: {
          data: [] as { id: string; type: string }[],
        },
      } as Parameters<typeof microOrmUtilServiceForUpdate.updateEntity>[1]);

      em.clear();

      // Verify all roles removed
      const userWithNoRoles = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      expect(userWithNoRoles.roles.getItems()).toHaveLength(0);

      // Verify roles still exist in DB
      const rolesStillExist = await em.find(Roles, {
        id: { $in: [roleX.id, roleY.id] },
      });
      expect(rolesStillExist).toHaveLength(2);
    });

    it('should handle adding to empty collection', async () => {
      const em = microOrmUtilServiceForUpdate.entityManager;

      // Create user without roles
      const user = createTestUser(em, 'test-user-no-roles');

      const roleNew1 = createTestRole(em, 'role-new-1', 'Role New 1');
      const roleNew2 = createTestRole(em, 'role-new-2', 'Role New 2');

      await em.persistAndFlush([user, roleNew1, roleNew2]);
      em.clear();

      // Load user (no roles)
      const loadedUser = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      expect(loadedUser.roles.getItems()).toHaveLength(0);

      // Add roles to empty collection
      const newRoles = await em.find(Roles, {
        id: { $in: [roleNew1.id, roleNew2.id] },
      });

      await microOrmUtilServiceForUpdate.updateEntity(loadedUser, {
        roles: {
          data: newRoles.map((r) => ({ type: 'roles', id: String(r.id) })),
        },
      } as Parameters<typeof microOrmUtilServiceForUpdate.updateEntity>[1]);

      em.clear();

      // Verify roles added
      const userWithRoles = await em.findOneOrFail(
        Users,
        { id: user.id },
        { populate: ['roles'] }
      );

      const roleIds = userWithRoles.roles
        .getItems()
        .map((r) => r.id)
        .sort();
      expect(roleIds).toEqual([roleNew1.id, roleNew2.id].sort());
    });
  });
});
