import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EntityData } from '@mikro-orm/core';
import { AclContext } from '../acl.seed';
import { ArticleFactory } from '../factory';
import {
  ArticleAcl,
  ArticleStatus,
  ArticleVisibility,
} from '../../../entities';
import { faker } from '@faker-js/faker';

export class ArticleSeed extends Seeder {
  async run(em: EntityManager, context: AclContext): Promise<void> {
    const articleFactory = new ArticleFactory(em);
    const alice = context.aclContext.users.find(user => user.login === 'alice')!;
    const bob = context.aclContext.users.find(user => user.login === 'bob')!;
    const moderator = context.aclContext.users.find(user => user.login === 'moderator')!;
    const charlie = context.aclContext.users.find(user => user.login === 'charlie')!;

    const articleData: EntityData<ArticleAcl>[] = [{
      title: 'Collaborative Article on AI',
      author: alice,
      coAuthorIds: [bob.id],
      editor: moderator,
    }, {
      title: 'Premium Content for Members',
      author: alice,
      metadata: {
        readTime: faker.number.int({ min: 5, max: 30 }),
        featured: true,
        premium: true, // ACL test: premium content
      }
    }, {
      title: 'Article Under Review',
      author: bob,
      coAuthorIds: [charlie.id],
      editor: moderator,
      status: ArticleStatus.REVIEW, // ACL test: review status
      visibility: ArticleVisibility.UNLISTED,
      publishedAt: null,
    }, {
      title: 'Temporary Access Article',
      author: charlie,
      expiresAt: new Date('2024-12-31'), // ACL test: time-based access
    }, {
      title: 'Private Draft Article',
      author: bob,
      status: ArticleStatus.DRAFT,
      visibility: ArticleVisibility.PRIVATE, // ACL test: private visibility
      publishedAt: null,
      expiresAt: null,
    }]

    const count = articleData.length;
    context.aclContext.articles = await articleFactory
      .each((article) => Object.assign(article, articleData.shift()))
      .create(count);
  }
}
