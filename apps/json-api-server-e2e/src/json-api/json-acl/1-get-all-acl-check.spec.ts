/**
 * ACL: GET All Resources - Permission and Field-Level Security
 *
 * This test suite verifies ACL (Access Control List) enforcement for fetching collections
 * of resources. It tests three permission levels with different capabilities:
 *
 * 1. Admin Role: Full access without conditions
 *    - Can read all resources and all fields
 *    - Can include all relationships
 *
 * 2. Moderator Role: Full access with field restrictions
 *    - Can read all resources
 *    - Cannot read sensitive fields (salary, role in nested relations)
 *    - Field filtering applied automatically by ACL
 *
 * 3. User Role: Conditional access with field restrictions
 *    - Can read only public profiles OR their own profile
 *    - Cannot read sensitive fields (salary, role, isPublic, createdAt, updatedAt)
 *    - Can read own phone number but not others' phone numbers
 *    - Row-level filtering applied automatically by ACL
 */

import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
  UserProfileAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL: GET All Resources (Collection Fetching)', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jsonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Admin Role: Full Access Without Restrictions', () => {
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');
      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(CheckFieldAndInclude).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch all profiles with all fields (no ACL restrictions)', async () => {
      await jsonSdk.jsonApiSdkService.getAll(UserProfileAcl)
    })

    it('should fetch all users with included profiles with all fields', async () => {
      await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
        include: ['profile'],
      });
    });
  })

  describe('Moderator Role: Full Access with Field-Level Restrictions', () => {
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(CheckFieldAndInclude).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch all profiles but exclude sensitive fields (role, salary)', async () => {
      const result = await jsonSdk.jsonApiSdkService.getAll(UserProfileAcl)

      for (const item of result) {
        expect(item.role).toBeUndefined()
        expect(item.salary).toBeUndefined()
        expect(item.role).toBeUndefined()
        expect(item.firstName).toBeDefined()
        expect(item.lastName).toBeDefined()
        expect(item.avatar).toBeDefined()
        expect(item.phone).toBeDefined()
        expect(item.createdAt).toBeDefined()
        expect(item.updatedAt).toBeDefined()
      }
    })

    it('should fetch all users with profiles but exclude salary from nested profile', async () => {
      const result = await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
        include: ['profile'],
      });
      for (const item of result) {
        expect(item.profile.salary).toBeUndefined()
        expect(item.profile.role).toBeDefined()
        expect(item.login).toBeDefined()
      }
    });
  })

  describe('User Role: Conditional Row-Level Access with Field Restrictions', () => {
    let countPublicProfile: UserProfileAcl[];
    beforeEach(async () => {
      countPublicProfile = await jsonSdk.jsonApiSdkService.getAll(UserProfileAcl, {
        filter: {
          target: {
            isPublic: {eq: 'true'}
          },
        }
      })
      const bobUser = usersAcl.find((user) => user.login === 'bob');
      if (!bobUser) throw new Error('bob user not found');
      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch only public profiles and own profile, with field restrictions and conditional phone visibility', async () => {

      const result = await jsonSdk.jsonApiSdkService.getAll(UserProfileAcl);
      expect(result.length).toBe(countPublicProfile.length + 1)
      for (const item of result) {
        expect(item.salary).toBeUndefined()
        expect(item.isPublic).toBeUndefined()
        expect(item.role).toBeUndefined()
        expect(item.createdAt).toBeUndefined()
        expect(item.updatedAt).toBeUndefined()

        if ((contextTestAcl.context.currentUser as UsersAcl).profile.id === item.id) {
          expect(item.phone).toBeDefined()
        } else {
          expect(item.phone).toBeUndefined()
        }

        expect(item.firstName).toBeDefined()
        expect(item.lastName).toBeDefined()
        expect(item.avatar).toBeDefined()
        expect(item.bio).toBeDefined()

      }
    })
  });
});
