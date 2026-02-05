/**
 * ACL: Atomic Operations - ACL Enforcement Across Batch Requests
 *
 * This test suite verifies ACL enforcement for atomic operations (batch requests)
 * where multiple operations are executed together. ACL rules are evaluated for
 * EACH individual operation within the atomic request.
 *
 * 1. Admin Role: Full atomic operation access
 *    - Can execute multiple operations in one atomic request
 *    - Can POST, PATCH, and DELETE in a single transaction
 *    - All operations succeed when permissions allow
 *
 * 2. Moderator Role: Partial atomic operation access
 *    - Can POST and PATCH in atomic request
 *    - CANNOT DELETE (returns 403 Forbidden for entire atomic request)
 *    - Atomic request fails if ANY operation violates ACL
 *    - Error message indicates which operation failed (e.g., "deleteOne on ArticleAcl")
 *    - Atomicity ensures either ALL operations succeed or ALL fail
 */

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

describe('ACL: Atomic Operations (Batch Request ACL Enforcement)', () => {
  let contextTestAcl: ContextTestAcl;
  let usersAcl: UsersAcl[];
  let articleAcl: ArticleAcl[];
  let jsonSdk: JsonSdkPromise;
  beforeEach(async () => {
    jsonSdk = creatSdk();
    contextTestAcl = new ContextTestAcl();
    contextTestAcl.aclRules = { rules: [] };
    contextTestAcl.context = {};
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

  describe('Admin Role: Full Atomic Operation Access', () => {
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
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should execute atomic operation with POST, PATCH, and DELETE all succeeding', async () => {
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

  describe('Moderator Role: Partial Atomic Operation Access with DELETE Restriction', () => {

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
      await jsonSdk.jsonApiSdkService.patchOne(contextTestAcl);
    });

    it('should return 403 Forbidden for entire atomic request when DELETE operation violates ACL (POST and PATCH allowed but DELETE forbidden)', async () => {
      const articleForCreate = Object.assign(
        new ArticleAcl(),
        getArticleData()
      );
      articleForCreate.author = moderatorUser;
      articleForCreate.status = ArticleStatus.DRAFT;
      try {
        const [articleForUpdate] = await jsonSdk.atomicFactory().postOne(articleForCreate).run();
        articleForUpdate.status = ArticleStatus.REVIEW;
        // Remove author relationship to avoid ACL field-level check on patchOne
        // (postOne now returns relationships in response, and moderator cannot write to author field)
        delete (articleForUpdate as any).author;
        await jsonSdk.atomicFactory().patchOne(articleForUpdate).deleteOne(articleForUpdate).run();
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        expect((e as AxiosError).response?.status).toBe(403);
        expect(((e as AxiosError).response?.data as {error: string})['error']).toContain('deleteOne on ArticleAcl');
      }
    })

  })
});
