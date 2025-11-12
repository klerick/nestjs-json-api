import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
  UserProfileAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';


describe('ACL getAll:', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
  });

  afterEach(async () => {
    await jsonSdk.jonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Without conditional: admin', () => {
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');
      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(CheckFieldAndInclude).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get all profile', async () => {
      await jsonSdk.jonApiSdkService.getAll(UserProfileAcl)
    })

    it('get all users with profile', async () => {
      await jsonSdk.jonApiSdkService.getAll(UsersAcl, {
        include: ['profile'],
      });
    });
  })

  describe('Without conditional but with fields: moderator', () => {
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(CheckFieldAndInclude).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get all profile', async () => {
      const result = await jsonSdk.jonApiSdkService.getAll(UserProfileAcl)

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

    it('get all users with profile', async () => {
      const result = await jsonSdk.jonApiSdkService.getAll(UsersAcl, {
        include: ['profile'],
      });
      for (const item of result) {
        expect(item.profile.salary).toBeUndefined()
        expect(item.profile.role).toBeDefined()
        expect(item.login).toBeDefined()
      }
    });
  })

  describe('With conditional: user', () => {
    let countPublicProfile: UserProfileAcl[];
    beforeEach(async () => {
      countPublicProfile = await jsonSdk.jonApiSdkService.getAll(UserProfileAcl, {
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
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('should be able to get allow profile', async () => {

      const result = await jsonSdk.jonApiSdkService.getAll(UserProfileAcl);
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
