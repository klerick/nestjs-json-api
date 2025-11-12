import {
  ContextTestAcl,
  UserRole,
  UsersAcl,
  ArticleAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL deleteOne:', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  let articleAcl: ArticleAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
    articleAcl = await jsonSdk.jonApiSdkService.getAll(ArticleAcl, {
      include: ['author', 'editor'],
    });
  });

  afterEach(async () => {
    await jsonSdk.jonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Without conditional: admin', () => {
    let articleForDelete: ArticleAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');

      const posibleArticle = articleAcl.find(
        (i) => i.author.login !== 'bob' && i.author.login !== 'alice'
      );
      if (!posibleArticle) throw new Error('article not found');
      articleForDelete = posibleArticle;

      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('delete one publish article', async () => {
      await jsonSdk.jonApiSdkService.deleteOne(articleForDelete);
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    let articleForDelete: ArticleAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');

      const posiblePosible = articleAcl.find(
        (item) => item.author.login === 'alice' && item.status === 'published'
      );
      if (!posiblePosible) throw new Error('article not found');
      articleForDelete = posiblePosible;

      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('get one profile', async () => {
      await jsonSdk.jonApiSdkService.deleteOne(articleForDelete);
    });
  });

  describe('With conditional: user', () => {
    describe('im author but article is published', () => {
      let aliceUser: UsersAcl;
      let articleAclAlice: ArticleAcl;
      beforeEach(async () => {
        const posibleAliceUser = usersAcl.find(
          (user) => user.login === 'alice'
        );
        if (!posibleAliceUser) throw new Error('bob user not found');
        aliceUser = posibleAliceUser;

        const posiblePosible = articleAcl.find(
          (item) =>
            item.author.id === aliceUser.id && item.status === 'published'
        );
        if (!posiblePosible) throw new Error('article not found');
        articleAclAlice = posiblePosible;

        contextTestAcl.context = { currentUser: aliceUser };
        contextTestAcl.aclRules.rules = new AbilityBuilder(
          CheckFieldAndInclude
        ).permissionsFor(UserRole.user).rules as any;
        await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
      });

      it('should be error to delete article', async () => {
        try {
          await jsonSdk.jonApiSdkService.deleteOne(articleAclAlice);
          assert.fail('should be error');
        } catch (e) {
          expect(e).toBeInstanceOf(AxiosError);
          expect((e as AxiosError).response?.status).toBe(403);
        }
      });
    });
    describe('im author but article is not published', () => {
      let bobUser: UsersAcl;

      let articleAclBobe: ArticleAcl;
      beforeEach(async () => {
        const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
        if (!posibleBobUser) throw new Error('bob user not found');
        bobUser = posibleBobUser;

        const posibleArticleBob = articleAcl.find(
          (item) => item.author.id === bobUser.id && item.status !== 'published'
        );
        if (!posibleArticleBob) throw new Error('article not found');
        articleAclBobe = posibleArticleBob;

        contextTestAcl.context = { currentUser: bobUser };
        contextTestAcl.aclRules.rules = new AbilityBuilder(
          CheckFieldAndInclude
        ).permissionsFor(UserRole.user).rules as any;
        await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
      });

      it('should be to delete article', async () => {
        await jsonSdk.jonApiSdkService.deleteOne(articleAclBobe);
      });
    });
  });
});
