import {
  CommentAcl,
  ContextTestAcl,
  PostAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';


describe('ACL patchRelationship:', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  let allPosts: PostAcl[];
  let allComments: CommentAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;

  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jsonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
      include: ['profile', 'posts', 'aclComments'],
    });
    allPosts = await jsonSdk.jsonApiSdkService.getAll(PostAcl);
    allComments = await jsonSdk.jsonApiSdkService.getAll(CommentAcl);
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Without conditional: admin', () => {
    let userForPatch: UsersAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Admin user not found');
      contextTestAcl.context = { currentUser: adminUser };

      const posibleUserForPatch = usersAcl.at(1);
      if (!posibleUserForPatch) throw new Error('User not found');
      userForPatch = posibleUserForPatch;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('patch rel aclComments for user (replace with different comments)', async () => {
      // const newComments = allComments
      //   .filter((c) => !userForPatch.aclComments?.some((uc) => uc.id === c.id))
      //   .slice(0, 2);
      // if (newComments.length < 2) {
      //   throw new Error('Not enough comments available');
      // }
      // userForPatch.aclComments = newComments as any;
      // await jsonSdk.jsonApiSdkService.patchRelationships(
      //   userForPatch,
      //   'aclComments'
      // );
    });

    it('patch rel posts for user (replace with different posts)', async () => {
      // const newPosts = allPosts
      //   .filter((p) => !userForPatch.posts?.some((up) => up.id === p.id))
      //   .slice(0, 2);
      // if (newPosts.length < 2) {
      //   throw new Error('Not enough posts available');
      // }
      // userForPatch.posts = newPosts as any;
      // await jsonSdk.jsonApiSdkService.patchRelationships(userForPatch, 'posts');
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    let userForPatch: UsersAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Moderator user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      const posibleUserForPatch = usersAcl.at(1);
      if (!posibleUserForPatch) throw new Error('User not found');
      userForPatch = posibleUserForPatch;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('patch rel aclComments for user, should be error', async () => {
      // try {
      //   const newComments = allComments
      //     .filter((c) => !userForPatch.aclComments?.some((uc) => uc.id === c.id))
      //     .slice(0, 2);
      //   if (newComments.length < 2) {
      //     throw new Error('Not enough comments available');
      //   }
      //   userForPatch.aclComments = newComments as any;
      //   await jsonSdk.jsonApiSdkService.patchRelationships(
      //     userForPatch,
      //     'aclComments'
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('patch rel posts for user (replace with different posts)', async () => {
      // const newPosts = allPosts
      //   .filter((p) => !userForPatch.posts?.some((up) => up.id === p.id))
      //   .slice(0, 2);
      // if (newPosts.length < 2) {
      //   throw new Error('Not enough posts available');
      // }
      // userForPatch.posts = newPosts as any;
      // await jsonSdk.jsonApiSdkService.patchRelationships(userForPatch, 'posts');
    });
  });

  describe('With conditional: user', () => {
    let bobUser: UsersAcl;
    let aliceUser: UsersAcl;
    beforeEach(async () => {
      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('Bob user not found');
      bobUser = posibleBobUser;

      const posibleAliceUser = usersAcl.find((user) => user.login === 'alice');
      if (!posibleAliceUser) throw new Error('Alice user not found');
      aliceUser = posibleAliceUser;

      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('patch rel aclComments for bob user (replace with different comments)', async () => {
      // const newComments = allComments
      //   .filter((c) => !bobUser.aclComments?.some((uc) => uc.id === c.id))
      //   .slice(0, 2);
      // if (newComments.length < 2) {
      //   throw new Error('Not enough comments available');
      // }
      // bobUser.aclComments = newComments as any;
      // await jsonSdk.jsonApiSdkService.patchRelationships(
      //   bobUser,
      //   'aclComments'
      // );
    });

    it('patch rel posts for bob user, should be error', async () => {
      // try {
      //   const newPosts = allPosts
      //     .filter((p) => !bobUser.posts?.some((up) => up.id === p.id))
      //     .slice(0, 2);
      //   if (newPosts.length < 2) {
      //     throw new Error('Not enough posts available');
      //   }
      //   bobUser.posts = newPosts as any;
      //   await jsonSdk.jsonApiSdkService.patchRelationships(bobUser, 'posts');
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('patch rel aclComments for alice, should be error', async () => {
      // try {
      //   const newComments = allComments
      //     .filter((c) => !aliceUser.aclComments?.some((uc) => uc.id === c.id))
      //     .slice(0, 2);
      //   if (newComments.length < 2) {
      //     throw new Error('Not enough comments available');
      //   }
      //   aliceUser.aclComments = newComments as any;
      //   await jsonSdk.jsonApiSdkService.patchRelationships(
      //     aliceUser,
      //     'aclComments'
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('patch rel posts for alice, should be error', async () => {
      // try {
      //   const newPosts = allPosts
      //     .filter((p) => !aliceUser.posts?.some((up) => up.id === p.id))
      //     .slice(0, 2);
      //   if (newPosts.length < 2) {
      //     throw new Error('Not enough posts available');
      //   }
      //   aliceUser.posts = newPosts as any;
      //   await jsonSdk.jsonApiSdkService.patchRelationships(aliceUser, 'posts');
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });
  });
});
