/**
 * ACL: DELETE One Resource - Delete Permission with Conditional Restrictions
 *
 * This test suite verifies ACL enforcement for deleting resources. It tests
 * complex permission scenarios based on article status and authorship.
 *
 * 1. Admin Role: Full delete access without conditions
 *    - Can delete any article regardless of status or author
 *
 * 2. Moderator Role: Can delete published articles
 *    - CAN delete published articles (even if not the author)
 *    - Status-based delete permission
 *
 * 3. User Role: Conditional delete based on status
 *    a) Author of published article:
 *       - CANNOT delete own published article - returns 403 Forbidden
 *       - Once published, article is protected from author deletion
 *    b) Author of non-published article:
 *       - CAN delete own non-published article (draft, review, etc.)
 *       - Owner-based delete permission for unpublished content
 */

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

describe('ACL: DELETE One Resource (Delete Operations)', () => {
  let contextTestAcl = new ContextTestAcl();
  let usersAcl: UsersAcl[];
  let articleAcl: ArticleAcl[];
  contextTestAcl.aclRules = { rules: [] };
  contextTestAcl.context = {};
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = await jsonSdk.jsonApiSdkService.postOne(contextTestAcl);
    usersAcl = await jsonSdk.jsonApiSdkService.getAll(UsersAcl, {
      include: ['profile'],
    });
    articleAcl = await jsonSdk.jsonApiSdkService.getAll(ArticleAcl, {
      include: ['author', 'editor'],
    });
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(contextTestAcl);
  });

  describe('Admin Role: Full Delete Access Without Restrictions', () => {
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
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should delete any article regardless of status or author (no ACL restrictions)', async () => {
      await jsonSdk.jsonApiSdkService.deleteOne(articleForDelete);
    });
  });

  describe('Moderator Role: Can Delete Published Articles', () => {
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
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should delete published article (moderator deleting alice published article)', async () => {
      await jsonSdk.jsonApiSdkService.deleteOne(articleForDelete);
    });
  });

  describe('User Role: Conditional Delete Based on Article Status', () => {
    describe('Author of Published Article: CANNOT Delete', () => {
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
        await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
      });

      it('should return 403 Forbidden when author attempts to delete own published article', async () => {
        try {
          await jsonSdk.jsonApiSdkService.deleteOne(articleAclAlice);
          assert.fail('should be error');
        } catch (e) {
          expect(e).toBeInstanceOf(AxiosError);
          expect((e as AxiosError).response?.status).toBe(403);
        }
      });
    });
    describe('Author of Non-Published Article: CAN Delete', () => {
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
        await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
      });

      it('should delete own non-published article (bob deleting bob draft article)', async () => {
        await jsonSdk.jsonApiSdkService.deleteOne(articleAclBobe);
      });
    });
  });
});
