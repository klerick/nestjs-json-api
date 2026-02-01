/**
 * ACL: GET One Resource - Permission and Field-Level Security
 *
 * This test suite verifies ACL enforcement for fetching individual resources by ID.
 * It tests three permission levels with different capabilities:
 *
 * 1. Admin Role: Full access without conditions
 *    - Can read any resource by ID with all fields
 *    - Can include all relationships
 *
 * 2. Moderator Role: Full access with field restrictions
 *    - Can read any resource by ID
 *    - Cannot read sensitive fields (salary, role in nested relations)
 *    - Field filtering applied automatically by ACL
 *
 * 3. User Role: Conditional row-level access with field restrictions
 *    - Can read own profile with phone number visible
 *    - Can read public profiles with phone number hidden
 *    - CANNOT read private profiles (returns 404 Not Found)
 *    - Cannot read sensitive fields (salary, role, isPublic, createdAt, updatedAt)
 *    - Row-level filtering prevents access to forbidden resources
 */

import {
  ContextTestAcl,
  UserProfileAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL: GET One Resource (Single Resource Fetching)', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  let publicUser: UsersAcl;
  let notPublicUser: UsersAcl;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jsonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
    publicUser = usersAcl.find((i) => i.profile.isPublic) as UsersAcl;
    notPublicUser = usersAcl.find(
      (i) => !i.profile.isPublic && i.login !== 'bob'
    ) as UsersAcl;
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Admin Role: Full Access Without Restrictions', () => {
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');
      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch any user by ID with all fields (no ACL restrictions)', async () => {
      await jsonSdk.jsonApiSdkService.getOne(UsersAcl, usersAcl[0].id);
    });

    it('should fetch any user by ID with included profile with all fields', async () => {
      await jsonSdk.jsonApiSdkService.getOne(UsersAcl, usersAcl[0].id, {
        include: ['profile'],
      });
    });
  });

  describe('Moderator Role: Full Access with Field-Level Restrictions', () => {
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch any profile by ID but exclude sensitive fields (role, salary)', async () => {
      const item = await jsonSdk.jsonApiSdkService.getOne(
        UserProfileAcl,
        usersAcl[0].id
      );
      expect(item.role).toBeUndefined();
      expect(item.salary).toBeUndefined();
      expect(item.role).toBeUndefined();
      expect(item.firstName).toBeDefined();
      expect(item.lastName).toBeDefined();
      expect(item.avatar).toBeDefined();
      expect(item.phone).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should fetch any user by ID with profile but exclude salary from nested profile', async () => {
      const item = await jsonSdk.jsonApiSdkService.getOne(
        UsersAcl,
        usersAcl[0].id,
        {
          include: ['profile'],
        }
      );
      expect(item.profile.salary).toBeUndefined();
      expect(item.profile.role).toBeDefined();
      expect(item.login).toBeDefined();
    });
  });

  describe('User Role: Conditional Row-Level Access with Field Restrictions', () => {
    let bobUser: UsersAcl;
    beforeEach(async () => {
      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('bob user not found');
      bobUser = posibleBobUser;
      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch own profile with phone visible and sensitive fields excluded', async () => {
      const item = await jsonSdk.jsonApiSdkService.getOne(
        UserProfileAcl,
        bobUser.profile.id
      );
      expect(item.salary).toBeUndefined();
      expect(item.isPublic).toBeUndefined();
      expect(item.role).toBeUndefined();
      expect(item.createdAt).toBeUndefined();
      expect(item.updatedAt).toBeUndefined();
      expect(item.phone).toBeDefined();
      expect(item.firstName).toBeDefined();
      expect(item.lastName).toBeDefined();
      expect(item.avatar).toBeDefined();
      expect(item.bio).toBeDefined();
    });

    it('should fetch public profile with phone hidden and sensitive fields excluded', async () => {
      const item = await jsonSdk.jsonApiSdkService.getOne(
        UserProfileAcl,
        publicUser.profile.id
      );
      expect(item.salary).toBeUndefined();
      expect(item.isPublic).toBeUndefined();
      expect(item.role).toBeUndefined();
      expect(item.createdAt).toBeUndefined();
      expect(item.updatedAt).toBeUndefined();
      expect(item.phone).toBeUndefined();
      expect(item.firstName).toBeDefined();
      expect(item.lastName).toBeDefined();
      expect(item.avatar).toBeDefined();
      expect(item.bio).toBeDefined();
    });
    it('should return 404 Not Found when attempting to fetch private profile of another user', async () => {
      try {
        await jsonSdk.jsonApiSdkService.getOne(
          UserProfileAcl,
          notPublicUser.profile.id
        );
        assert.fail('should be not found');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(404);
      }
    });
  });
});
