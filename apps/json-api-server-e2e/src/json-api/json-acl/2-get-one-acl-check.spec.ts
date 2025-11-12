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

describe('ACL getOne:', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  let publicUser: UsersAcl;
  let notPublicUser: UsersAcl;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
    publicUser = usersAcl.find((i) => i.profile.isPublic) as UsersAcl;
    notPublicUser = usersAcl.find(
      (i) => !i.profile.isPublic && i.login !== 'bob'
    ) as UsersAcl;
  });

  afterEach(async () => {
    await jsonSdk.jonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Without conditional: admin', () => {
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');
      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get one profile', async () => {
      await jsonSdk.jonApiSdkService.getOne(UsersAcl, usersAcl[0].id);
    });

    it('get one users with profile', async () => {
      await jsonSdk.jonApiSdkService.getOne(UsersAcl, usersAcl[0].id, {
        include: ['profile'],
      });
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get one profile', async () => {
      const item = await jsonSdk.jonApiSdkService.getOne(
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

    it('get one users with profile', async () => {
      const item = await jsonSdk.jonApiSdkService.getOne(
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

  describe('With conditional: user', () => {
    let bobUser: UsersAcl;
    beforeEach(async () => {
      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('bob user not found');
      bobUser = posibleBobUser;
      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('should be able to get owner profile', async () => {
      const item = await jsonSdk.jonApiSdkService.getOne(
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

    it('should be able to get public profile', async () => {
      const item = await jsonSdk.jonApiSdkService.getOne(
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
    it('should be not found to get not public profile', async () => {
      try {
        await jsonSdk.jonApiSdkService.getOne(
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
