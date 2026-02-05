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



describe('ACL postRelationship:', () => {
  let contextTestAcl: ContextTestAcl;
  let usersAcl: UsersAcl[];
  let allPosts: PostAcl[];
  let allComments: CommentAcl[];
  let jsonSdk: JsonSdkPromise;

  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = new ContextTestAcl();
    contextTestAcl.aclRules = { rules: [] };
    contextTestAcl.context = {};
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
    let userForAdd: UsersAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Admin user not found');
      contextTestAcl.context = { currentUser: adminUser };

      const posibleUserForAdd = usersAcl.at(1);
      if (!posibleUserForAdd) throw new Error('User not found');
      userForAdd = posibleUserForAdd;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('add rel aclComments for user', async () => {
      // const commentToAdd = allComments.find(
      //   (c) => !userForAdd.aclComments?.some((uc) => uc.id === c.id)
      // );
      // if (!commentToAdd) {
      //   throw new Error('No available comment to add');
      // }
      // userForAdd.aclComments = [commentToAdd] as any;
      // await jsonSdk.jsonApiSdkService.postRelationships(
      //   userForAdd,
      //   'aclComments'
      // );
    });

    it('add rel posts for user', async () => {
      // const postToAdd = allPosts.find(
      //   (p) => !userForAdd.posts?.some((up) => up.id === p.id)
      // );
      // if (!postToAdd) {
      //   throw new Error('No available post to add');
      // }
      // userForAdd.posts = [postToAdd] as any;
      // await jsonSdk.jsonApiSdkService.postRelationships(userForAdd, 'posts');
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    let userForAdd: UsersAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Moderator user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      const posibleUserForAdd = usersAcl.at(1);
      if (!posibleUserForAdd) throw new Error('User not found');
      userForAdd = posibleUserForAdd;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('add rel aclComments for user, should be error', async () => {
      // try {
      //   const commentToAdd = allComments.find(
      //     (c) => !userForAdd.aclComments?.some((uc) => uc.id === c.id)
      //   );
      //   if (!commentToAdd) {
      //     throw new Error('No available comment to add');
      //   }
      //   userForAdd.aclComments = [commentToAdd] as any;
      //   await jsonSdk.jsonApiSdkService.postRelationships(
      //     userForAdd,
      //     'aclComments'
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('add rel posts for user', async () => {
      // const postToAdd = allPosts.find(
      //   (p) => !userForAdd.posts?.some((up) => up.id === p.id)
      // );
      // if (!postToAdd) {
      //   throw new Error('No available post to add');
      // }
      // userForAdd.posts = [postToAdd] as any;
      // await jsonSdk.jsonApiSdkService.postRelationships(userForAdd, 'posts');
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

    it('add rel aclComments for bob user', async () => {
      // const commentToAdd = allComments.find(
      //   (c) => !bobUser.aclComments?.some((uc) => uc.id === c.id)
      // );
      // if (!commentToAdd) {
      //   throw new Error('No available comment to add');
      // }
      // bobUser.aclComments = [commentToAdd] as any;
      // await jsonSdk.jsonApiSdkService.postRelationships(
      //   bobUser,
      //   'aclComments'
      // );
    });

    it('add rel posts for bob user, should be error', async () => {
      // try {
      //   const postToAdd = allPosts.find(
      //     (p) => !bobUser.posts?.some((up) => up.id === p.id)
      //   );
      //   if (!postToAdd) {
      //     throw new Error('No available post to add');
      //   }
      //   bobUser.posts = [postToAdd] as any;
      //   await jsonSdk.jsonApiSdkService.postRelationships(bobUser, 'posts');
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('add rel aclComments for alice, should be error', async () => {
      // try {
      //   const commentToAdd = allComments.find(
      //     (c) => !aliceUser.aclComments?.some((uc) => uc.id === c.id)
      //   );
      //   if (!commentToAdd) {
      //     throw new Error('No available comment to add');
      //   }
      //   aliceUser.aclComments = [commentToAdd] as any;
      //   await jsonSdk.jsonApiSdkService.postRelationships(
      //     aliceUser,
      //     'aclComments'
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('add rel posts for alice, should be error', async () => {
      // try {
      //   const postToAdd = allPosts.find(
      //     (p) => !aliceUser.posts?.some((up) => up.id === p.id)
      //   );
      //   if (!postToAdd) {
      //     throw new Error('No available post to add');
      //   }
      //   aliceUser.posts = [postToAdd] as any;
      //   await jsonSdk.jsonApiSdkService.postRelationships(aliceUser, 'posts');
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });
  });
});
