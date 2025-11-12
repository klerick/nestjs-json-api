import {
  ArticleAcl,
  ArticleStatus,
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

describe('ACL patchOne:', () => {
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
    let articleForUpdate: ArticleAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Daphne user not found');

      const posibleArticle = articleAcl.find(
        (i) => i.author.login !== 'bob' && i.author.login !== 'alice'
      );
      if (!posibleArticle) throw new Error('article not found');
      articleForUpdate = posibleArticle;

      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('update one publish article', async () => {
      articleForUpdate.title = 'new title';
      await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
    });
  });

  describe('Without conditional but with fields: moderator', () => {
    let articlePublishForUpdate: ArticleAcl;
    let articleNoPublishForUpdate: ArticleAcl;
    beforeEach(async () => {
      const moderatorUser = usersAcl.find((user) => user.login === 'moderator');

      const posiblePublishArticle = articleAcl.find(
        (item) => item.status === 'published'
      );
      if (!posiblePublishArticle) throw new Error('article not found');
      articlePublishForUpdate = posiblePublishArticle;

      const posibleNpPublishArticle = articleAcl.find(
        (item) => item.status !== 'published' && item.status !== 'review'
      );
      if (!posibleNpPublishArticle) throw new Error('article not found');
      articleNoPublishForUpdate = posibleNpPublishArticle;

      if (!moderatorUser) throw new Error('Sheila user not found');
      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('try update publish article, should be error', async () => {
      try {
        await jsonSdk.jonApiSdkService.patchOne(articlePublishForUpdate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('try update no publish article not allow field, should be error', async () => {
      const oldTitle = articleNoPublishForUpdate.title;
      try {
        articleNoPublishForUpdate.title = 'new title';
        await jsonSdk.jonApiSdkService.patchOne(articleNoPublishForUpdate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
        articleNoPublishForUpdate.title = oldTitle;
      }
    });

    it('try update no publish article allow field not allow value, should be error', async () => {
      try {
        articleNoPublishForUpdate.status = ArticleStatus.PUBLISHED;
        await jsonSdk.jonApiSdkService.patchOne(articleNoPublishForUpdate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('try update no publish article allow field allow value', async () => {
      articleNoPublishForUpdate.status = ArticleStatus.REVIEW;
      // @ts-ignore
      delete articleNoPublishForUpdate.author;
      await jsonSdk.jonApiSdkService.patchOne(articleNoPublishForUpdate);
    });
  });

  describe('With conditional: user', () => {
    let aliceUser: UsersAcl;
    let bobUser: UsersAcl;
    let articleForUpdate: ArticleAcl;
    let articleForUpdateAlice: ArticleAcl;
    beforeEach(async () => {
      const posibleAliceUser = usersAcl.find((user) => user.login === 'alice');
      if (!posibleAliceUser) throw new Error('bob user not found');
      aliceUser = posibleAliceUser;

      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('Bob user not found');
      bobUser = posibleBobUser;

      const listAliceArticleForUpdate = await jsonSdk.jonApiSdkService.getAll(
        ArticleAcl,
        {
          filter: {
            author: { id: { eq: aliceUser.id.toString() } },
          },
          include: ['author'],
        }
      );

      const posibleAliceArticle = listAliceArticleForUpdate.at(0);
      if (!posibleAliceArticle) throw new Error('article not found');
      articleForUpdateAlice = posibleAliceArticle;
    });
    describe('coAuthor can update article if remove himself from coAuthorIds', () => {
      beforeEach(async () => {
        contextTestAcl.context = { currentUser: bobUser };
        contextTestAcl.aclRules.rules = new AbilityBuilder(
          CheckFieldAndInclude
        ).permissionsFor(UserRole.user).rules as any;
        await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);

        const listArticleForUpdate = await jsonSdk.jonApiSdkService.getAll(
          ArticleAcl,
          {
            filter: {
              author: { id: { eq: aliceUser.id.toString() } },
              target: { coAuthorIds: { some: [bobUser.id.toString()] } },
            },
            include: ['author'],
          }
        );

        const posibleArticle = listArticleForUpdate.at(0);
        if (!posibleArticle) throw new Error('article not found');
        articleForUpdate = posibleArticle;
      });

      it('try to update coAuthorIds with other coAuthorIds should be error', async () => {
        const save = articleForUpdate.coAuthorIds;
        try {
          articleForUpdate.coAuthorIds = [...articleForUpdate.coAuthorIds, 6];
          // @ts-ignore
          delete articleForUpdate.author;
          await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
          assert.fail('should be error');
        } catch (e) {
          expect(e).toBeInstanceOf(AxiosError);
          expect((e as AxiosError).response?.status).toBe(403);
          articleForUpdate.coAuthorIds = save;
        }
      });
      it('try to update coAuthorIds with other coAuthorIds and remove himself should be error', async () => {
        const save = articleForUpdate.coAuthorIds;
        try {
          articleForUpdate.coAuthorIds = [
            ...articleForUpdate.coAuthorIds.filter((i) => i !== bobUser.id),
            6,
          ];
          // @ts-ignore
          delete articleForUpdate.author;
          await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
          assert.fail('should be error');
        } catch (e) {
          expect(e).toBeInstanceOf(AxiosError);
          expect((e as AxiosError).response?.status).toBe(403);
          articleForUpdate.coAuthorIds = save;
        }
      });

      it('can update', async () => {
        articleForUpdate.coAuthorIds = articleForUpdate.coAuthorIds.filter(
          (i) => i !== bobUser.id
        );
        // @ts-ignore
        delete articleForUpdate.author;
        await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
      });
    });

    describe('Author can update article', () => {
      beforeEach(async () => {
        contextTestAcl.context = { currentUser: aliceUser };
        contextTestAcl.aclRules.rules = new AbilityBuilder(
          CheckFieldAndInclude
        ).permissionsFor(UserRole.user).rules as any;
        await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
      });
      it('can update', async () => {
        articleForUpdateAlice.title = 'new Title';
        await jsonSdk.jonApiSdkService.patchOne(articleForUpdateAlice);
      });
    });
  });
});
