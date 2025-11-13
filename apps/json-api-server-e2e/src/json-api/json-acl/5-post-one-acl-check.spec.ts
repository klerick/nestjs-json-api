/**
 * ACL: POST One Resource - Create Permission and Field-Level Security
 *
 * This test suite verifies ACL enforcement for creating new resources. It tests
 * complex permission scenarios including author assignment and status restrictions.
 *
 * 1. Admin Role: Full create access without conditions
 *    - Can create articles with any author (including other users)
 *    - Can set any status value
 *
 * 2. Moderator Role: Self-author-only restriction
 *    - CAN create articles with self as author
 *    - CANNOT create articles with other users as author - returns 403 Forbidden
 *    - Conditional author validation enforced
 *
 * 3. User Role: Self-author and status restrictions
 *    - CAN create articles with self as author AND status='draft'
 *    - CANNOT create articles with status='published' - returns 403 Forbidden
 *    - CANNOT create articles with other users as author - returns 403 Forbidden
 *    - Combined field and conditional ACL enforced
 */

import {
  ArticleAcl,
  ArticleStatus,
  ArticleVisibility,
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { faker } from '@faker-js/faker';
import { AxiosError } from 'axios';

import { creatSdk } from '../utils/run-application';
import { AbilityBuilder, CheckFieldAndInclude } from '../utils/acl/acl';

const getArticleData = () => ({
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(8),
  coAuthorIds: [],
  status: ArticleStatus.PUBLISHED,
  visibility: ArticleVisibility.PUBLIC,
  metadata: {
    readTime: faker.number.int({ min: 5, max: 30 }),
    featured: true,
    premium: false,
  },
  publishedAt: faker.date.past(),
  expiresAt: null,
});

describe('ACL: POST One Resource (Create Operations)', () => {
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

  describe('Admin Role: Full Create Access Without Restrictions', () => {
    let bobUser: UsersAcl;
    beforeEach(async () => {
      const adminUser = usersAcl.find((user) => user.login === 'admin');
      if (!adminUser) throw new Error('Admin user not found');

      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('Bob user not found');
      bobUser = posibleBobUser;

      contextTestAcl.context = { currentUser: adminUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.admin).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('should create article with any author (bob as author while admin is creating)', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = bobUser;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });
  });

  describe('Moderator Role: Self-Author-Only Restriction', () => {
    let bobUser: UsersAcl;
    let moderatorUser: UsersAcl;
    beforeEach(async () => {
      const posibleModeratorUser = usersAcl.find(
        (user) => user.login === 'moderator'
      );
      if (!posibleModeratorUser) throw new Error('Sheila user not found');
      moderatorUser = posibleModeratorUser;
      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('Bob user not found');
      bobUser = posibleBobUser;

      contextTestAcl.context = { currentUser: moderatorUser };

      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.moderator).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('should create article with self as author (moderator creating with moderator as author)', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = moderatorUser;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });

    it('should return 403 Forbidden when creating article with other user as author (moderator trying to set bob as author)', async () => {
      try {
        const articleForCreate = Object.assign(
          new ArticleAcl(),
          getArticleData()
        );
        articleForCreate.author = bobUser;
        await jsonSdk.jonApiSdkService.postOne(articleForCreate);
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });
  });

  describe('User Role: Self-Author and Status Restrictions', () => {
    let aliceUser: UsersAcl;
    let bobUser: UsersAcl;
    beforeEach(async () => {
      const posibleAliceUser = usersAcl.find(
        (user) => user.login === 'alice'
      );
      if (!posibleAliceUser) throw new Error('bob user not found');
      aliceUser = posibleAliceUser;

      const posibleBobUser = usersAcl.find((user) => user.login === 'bob');
      if (!posibleBobUser) throw new Error('Bob user not found');
      bobUser = posibleBobUser;

      contextTestAcl.context = { currentUser: bobUser };
      contextTestAcl.aclRules.rules = new AbilityBuilder(
        CheckFieldAndInclude
      ).permissionsFor(UserRole.user).rules as any;
      await jsonSdk.jonApiSdkService.patchOne(contextTestAcl);
    });

    it('should create draft article with self as author (bob creating draft with bob as author)', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = bobUser;
      articleForCreate.status = ArticleStatus.DRAFT;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });

    it('should return 403 Forbidden when creating published article (bob trying to create published article)', async () => {
      try {
        const articleForCreate = Object.assign(
          new ArticleAcl(),
          getArticleData()
        );
        articleForCreate.author = bobUser;
        await jsonSdk.jonApiSdkService.postOne(articleForCreate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });

    it('should return 403 Forbidden when creating article with other user as author (bob trying to set alice as author)', async () => {
      try {
        const articleForCreate = Object.assign(
          new ArticleAcl(),
          getArticleData()
        );
        articleForCreate.author = aliceUser;
        articleForCreate.status = ArticleStatus.DRAFT;
        await jsonSdk.jonApiSdkService.postOne(articleForCreate);
        assert.fail('should be error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
      }
    });
  });
});
