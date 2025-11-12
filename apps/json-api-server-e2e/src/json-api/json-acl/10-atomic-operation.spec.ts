import { faker } from '@faker-js/faker';
import {
  ArticleAcl,
  ArticleStatus,
  ArticleVisibility,
  ContextTestAcl,
  UserRole,
  UsersAcl,
} from '@nestjs-json-api/microorm-database/entity';
import { AxiosError } from 'axios';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
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

describe('ACL atomic operation:', () => {
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

    it('create one publish article with moderator author', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData(),
      );
      articleForCreate.author = bobUser;

      const [articleForUpdate] = await jsonSdk.atomicFactory().postOne(articleForCreate).run();
      articleForUpdate.title = 'new title'
      await jsonSdk.atomicFactory().patchOne(articleForUpdate).deleteOne(articleForUpdate).run();
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

    it('allow create and patch but delete not allow', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = moderatorUser;
      articleForCreate.status = ArticleStatus.DRAFT;
      try {
        const [articleForUpdate] = await jsonSdk.atomicFactory().postOne(articleForCreate).run();
        articleForUpdate.status = ArticleStatus.REVIEW;
        await jsonSdk.atomicFactory().patchOne(articleForUpdate).deleteOne(articleForUpdate).run();
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
        expect(((e as AxiosError).response?.data as {error: string})['error']).toContain('deleteOne on ArticleAcl');
      }
    })

  })
});
