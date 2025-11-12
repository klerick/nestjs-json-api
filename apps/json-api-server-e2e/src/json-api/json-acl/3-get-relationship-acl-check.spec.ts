import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';


describe('ACL getRelationship:', () => {
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
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get rel profile for user', async () => {
      await jsonSdk.jonApiSdkService.getRelationships(userForGet, 'profile');
    });

    it('get rel post for user', async () => {
      await jsonSdk.jonApiSdkService.getRelationships(userForGet, 'posts');
    });
  });

  describe('Without conditional but with fields: moderator', () => {
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
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get rel profile for user, shoudl be error', async () => {
      try {
        await jsonSdk.jonApiSdkService.getRelationships(userForGet, 'profile');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('get rel post for user', async () => {
      await jsonSdk.jonApiSdkService.getRelationships(userForGet, 'posts');
    });
  });

  describe('With conditional: user', () => {
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
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get rel post for bob user', async () => {
      await jsonSdk.jonApiSdkService.getRelationships(bobUser, 'posts');
    });
    it('get rel profile for bob user', async () => {
      await jsonSdk.jonApiSdkService.getRelationships(bobUser, 'profile');
    });

    it('get rel profile for alise, shoudl be error', async () => {
      try {
        await jsonSdk.jonApiSdkService.getRelationships(alisUser, 'profile');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('get rel post for alise, should be error', async () => {
      try {
        await jsonSdk.jonApiSdkService.getRelationships(alisUser, 'posts');
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });
  });
});
