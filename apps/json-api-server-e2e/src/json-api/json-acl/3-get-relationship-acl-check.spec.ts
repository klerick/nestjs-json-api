/**
 * ACL: GET Relationships - Relationship Access Control
 *
 * This test suite verifies ACL enforcement for fetching relationship data via
 * the relationships endpoint (/resources/{id}/relationships/{relationshipName}).
 * It tests three permission levels with different capabilities:
 *
 * 1. Admin Role: Full relationship access without conditions
 *    - Can fetch any relationship for any resource
 *    - Can access both 'profile' and 'posts' relationships
 *
 * 2. Moderator Role: Selective relationship access
 *    - CANNOT fetch 'profile' relationship (returns 403 Forbidden)
 *    - CAN fetch 'posts' relationship
 *    - Relationship-level restrictions applied
 *
 * 3. User Role: Owner-only relationship access
 *    - Can fetch relationships ONLY for own resources
 *    - CANNOT fetch relationships for other users' resources (returns 403 Forbidden)
 *    - Row-level security enforced at relationship endpoint level
 */

import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL: GET Relationships (Relationship Endpoint Access)', () => {
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

  describe('Admin Role: Full Relationship Access Without Restrictions', () => {
    let userForGet: UsersAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');
      contextTestAcl.context = { currentUser: adminUser };

      const posibleUserForGet = usersAcl.at(1);
      if (!posibleUserForGet) throw new Error('First user not found');
      userForGet = posibleUserForGet;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch profile relationship for any user', async () => {
      await jsonSdk.jsonApiSdkService.getRelationships(userForGet, 'profile');
    });

    it('should fetch posts relationship for any user', async () => {
      await jsonSdk.jsonApiSdkService.getRelationships(userForGet, 'posts');
    });
  });

  describe('Moderator Role: Selective Relationship Access', () => {
    let userForGet: UsersAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      const posibleUserForGet = usersAcl.at(1);
      if (!posibleUserForGet) throw new Error('First user not found');
      userForGet = posibleUserForGet;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should return 403 Forbidden when fetching profile relationship (restricted relationship)', async () => {
      try {
        await jsonSdk.jsonApiSdkService.getRelationships(userForGet, 'profile');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('should fetch posts relationship for any user (allowed relationship)', async () => {
      await jsonSdk.jsonApiSdkService.getRelationships(userForGet, 'posts');
    });
  });

  describe('User Role: Owner-Only Relationship Access', () => {
    let bobUser: UsersAcl;
    let alisUser: UsersAcl;
    beforeEach(async () => {
      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('bob user not found');
      bobUser = posibleBobUser;

      const posibleAliseUser = usersAcl.find((user) => user.login === 'alice');
      if (!posibleAliseUser) throw new Error('alise user not found');
      alisUser = posibleAliseUser;

      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should fetch posts relationship for own user (bob accessing bob)', async () => {
      await jsonSdk.jsonApiSdkService.getRelationships(bobUser, 'posts');
    });
    it('should fetch profile relationship for own user (bob accessing bob)', async () => {
      await jsonSdk.jsonApiSdkService.getRelationships(bobUser, 'profile');
    });

    it('should return 403 Forbidden when fetching profile relationship for another user (bob accessing alice)', async () => {
      try {
        await jsonSdk.jsonApiSdkService.getRelationships(alisUser, 'profile');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('should return 403 Forbidden when fetching posts relationship for another user (bob accessing alice)', async () => {
      try {
        await jsonSdk.jsonApiSdkService.getRelationships(alisUser, 'posts');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });
  });
});
