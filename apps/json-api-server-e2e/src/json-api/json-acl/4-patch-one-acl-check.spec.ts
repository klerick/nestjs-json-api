/**
 * ACL: PATCH One Resource - Update Permission and Field-Level Security
 *
 * This test suite verifies ACL enforcement for updating resources. It tests complex
 * permission scenarios including field-level restrictions and conditional value validation.
 *
 * 1. Admin Role: Full update access without conditions
 *    - Can update any resource with any field values
 *
 * 2. Moderator Role: Complex field and value restrictions
 *    - CANNOT update published articles (status='published') - returns 403 Forbidden
 *    - CANNOT update 'title' field in non-published articles - returns 403 Forbidden
 *    - CANNOT set status to 'published' - returns 403 Forbidden
 *    - CAN set status to 'review' for non-published articles
 *    - Field-level and value-level ACL enforced
 *
 * 3. User Role: Owner-based conditional update access
 *    a) coAuthor scenario:
 *       - CANNOT add new coAuthorIds - returns 403 Forbidden
 *       - CANNOT modify coAuthorIds while keeping themselves - returns 403 Forbidden
 *       - CAN remove themselves from coAuthorIds
 *    b) Author scenario:
 *       - CAN update own articles
 *       - Row-level security enforced (only own resources)
 */

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

describe('ACL: PATCH One Resource (Update Operations)', () => {
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

  describe('Admin Role: Full Update Access Without Restrictions', () => {
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

    it('should update any article with any field values (no ACL restrictions)', async () => {
      articleForUpdate.title = 'new title';
      await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
    });
  });

  describe('Moderator Role: Field and Value-Level Restrictions', () => {
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

    it('should return 403 Forbidden when attempting to update published article', async () => {
      try {
        await jsonSdk.jonApiSdkService.patchOne(articlePublishForUpdate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('should return 403 Forbidden when attempting to update restricted field (title) in non-published article', async () => {
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

    it('should return 403 Forbidden when attempting to set status to forbidden value (published)', async () => {
      try {
        articleNoPublishForUpdate.status = ArticleStatus.PUBLISHED;
        await jsonSdk.jonApiSdkService.patchOne(articleNoPublishForUpdate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('should update non-published article with allowed field (status) and allowed value (review)', async () => {
      articleNoPublishForUpdate.status = ArticleStatus.REVIEW;
      // @ts-ignore
      delete articleNoPublishForUpdate.author;
      await jsonSdk.jonApiSdkService.patchOne(articleNoPublishForUpdate);
    });
  });

  describe('User Role: Owner-Based Conditional Update Access', () => {
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
    describe('coAuthor Scenario: Can Only Remove Self from coAuthorIds', () => {
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

      it('should return 403 Forbidden when adding new coAuthorIds while keeping self', async () => {
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
      it('should return 403 Forbidden when modifying coAuthorIds with new ids even after removing self', async () => {
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

      it('should update article when coAuthor removes only themselves from coAuthorIds', async () => {
        articleForUpdate.coAuthorIds = articleForUpdate.coAuthorIds.filter(
          (i) => i !== bobUser.id
        );
        // @ts-ignore
        delete articleForUpdate.author;
        await jsonSdk.jonApiSdkService.patchOne(articleForUpdate);
      });
    });

    describe('Author Scenario: Can Update Own Articles', () => {
      beforeEach(async () => {
        contextTestAcl.context = { currentUser: aliceUser };
        contextTestAcl.aclRules.rules = new AbilityBuilder(
          CheckFieldAndInclude
        ).permissionsFor(UserRole.user).rules as any;
        await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
      });
      it('should update own article (alice updating alice article)', async () => {
        articleForUpdateAlice.title = 'new Title';
        await jsonSdk.jonApiSdkService.patchOne(articleForUpdateAlice);
      });
    });
  });
});
