import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL deleteRelationship:', () => {
  let contextTestAcl: ContextTestAcl;
  let usersAcl: UsersAcl[];
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
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Without conditional: admin', () => {
    let userForDelete: UsersAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Admin user not found');
      contextTestAcl.context = { currentUser: adminUser };

      const posibleUserForDelete = usersAcl.find(
        (u) => u.aclComments && u.aclComments.length > 0
      );
      if (!posibleUserForDelete)
        throw new Error('User with comments not found');
      userForDelete = posibleUserForDelete;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('delete rel aclComments for user', async () => {
      // const commentToDelete = userForDelete.aclComments[0];
      // if (!commentToDelete) {
      //   throw new Error('User has no cpmment');
      // }
      // userForDelete.aclComments = [commentToDelete] as any
      // await jsonSdk.jsonApiSdkService.deleteRelationships(
      //   userForDelete,
      //   'aclComments'
      // );
    });

    it('delete rel posts for user', async () => {
      // const postToDelete = userForDelete.posts[0];
      // if (!postToDelete) {
      //   throw new Error('User has no posts');
      // }
      // userForDelete.posts = [postToDelete] as any
      // await jsonSdk.jsonApiSdkService.deleteRelationships(
      //   userForDelete,
      //   'posts'
      // );
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    let userForDelete: UsersAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');
      if (!moderatorUser) throw new Error('Moderator user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      const posibleUserForDelete = usersAcl.find(
        (u) => u.posts && u.posts.length > 0
      );
      if (!posibleUserForDelete) throw new Error('User with posts not found');
      userForDelete = posibleUserForDelete;

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('delete rel aclComments for user, should be error', async () => {
      // try {
      //   const commentToDelete = userForDelete.aclComments![0];
      //   await jsonSdk.jsonApiSdkService.deleteRelationships(
      //     userForDelete,
      //     'aclComments',
      //     commentToDelete
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('delete rel posts for user', async () => {
      // const postToDelete = userForDelete.posts![0];
      // await jsonSdk.jsonApiSdkService.deleteRelationships(
      //   userForDelete,
      //   'posts',
      //   postToDelete
      // );
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

    it('delete rel aclComments for bob user', async () => {
      // if (!bobUser.aclComments || bobUser.aclComments.length === 0) {
      //   throw new Error('Bob has no comments');
      // }
      // const commentToDelete = bobUser.aclComments[0];
      // await jsonSdk.jsonApiSdkService.deleteRelationships(
      //   bobUser,
      //   'aclComments',
      //   commentToDelete
      // );
    });

    it('delete rel posts for bob user, should be error', async () => {
      // try {
      //   if (!bobUser.posts || bobUser.posts.length === 0) {
      //     throw new Error('Bob has no posts');
      //   }
      //   const postToDelete = bobUser.posts[0];
      //   await jsonSdk.jsonApiSdkService.deleteRelationships(
      //     bobUser,
      //     'posts',
      //     postToDelete
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('delete rel aclComments for alice, should be error', async () => {
      // try {
      //   if (!aliceUser.aclComments || aliceUser.aclComments.length === 0) {
      //     throw new Error('Alice has no comments');
      //   }
      //   const commentToDelete = aliceUser.aclComments[0];
      //   await jsonSdk.jsonApiSdkService.deleteRelationships(
      //     aliceUser,
      //     'aclComments',
      //     commentToDelete
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });

    it('delete rel posts for alice, should be error', async () => {
      // try {
      //   if (!aliceUser.posts || aliceUser.posts.length === 0) {
      //     throw new Error('Alice has no posts');
      //   }
      //   const postToDelete = aliceUser.posts[0];
      //   await jsonSdk.jsonApiSdkService.deleteRelationships(
      //     aliceUser,
      //     'posts',
      //     postToDelete
      //   );
      //   assert.fail('should be error');
      // } catch (e) {
      //   expect(e).toBeInstanceOf(AxiosError);
      //   expect((e as AxiosError).response?.status).toBe(403);
      // }
    });
  });
});
