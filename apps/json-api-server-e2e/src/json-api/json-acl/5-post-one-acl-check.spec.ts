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

describe('ACL postOne:', () => {
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

    it('create one publish article with come other author', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = bobUser;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });
  });

  describe('With conditional but with fields: moderator', () => {
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

    it('create one publish article with moderator author', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = moderatorUser;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });

    it('create one publish article with come other author should be error', async () => {
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

  describe('With conditional: user', () => {
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

    it('create one no publish article with bob author', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = bobUser;
      articleForCreate.status = ArticleStatus.DRAFT;
      await jsonSdk.jonApiSdkService.postOne(articleForCreate);
    });

    it('create one publish article with bob author should be error', async () => {
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

    it('create article with some other author should be error', async () => {
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
