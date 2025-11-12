import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CategoryAcl,
  UsersAcl,
  PostAcl,
  TagAcl,
  CommentAcl,
  ArticleAcl,
  DocumentAcl,
} from '../../entities/acl-test';

import { Context } from '../database.seeder';

export type InnerAclContext = {
  users: UsersAcl[];
  categories: CategoryAcl[];
  posts: PostAcl[];
  tags: TagAcl[];
  comments: CommentAcl[];
  articles: ArticleAcl[];
  documents: DocumentAcl[];
};

export type AclContext = Context & { aclContext: InnerAclContext };

import {
  UsersSeed,
  CategorySeed,
  PostSeed,
  TagSeed,
  CommentSeed,
  DocumentSeed,
  ArticleSeed,
} from './seeds';

/**
 * ACL Test Data Seeder
 *
 * Creates comprehensive test data for all ACL permission scenarios:
 * - Ownership patterns (author, owner, creator)
 * - Role-based access (admin, moderator, user)
 * - Status-based filtering (draft, published, archived)
 * - Field-level permissions (private fields like phone, salary)
 * - Relationship permissions (includes, joins)
 * - Array conditions (co-authors, shared users)
 * - Time-based access (expires_at)
 */
export class AclSeed extends Seeder {
  async run(em: EntityManager, context: Context = {}): Promise<void> {
    const innerContext: InnerAclContext = {
      users: [],
      categories: [],
      posts: [],
      tags: [],
      comments: [],
      articles: [],
      documents: [],
    };
    const aclContext = {
      ...context,
      aclContext: innerContext,
    };
    await this.call(em, [UsersSeed, CategorySeed], aclContext);
    await this.call(em, [TagSeed], aclContext);
    await this.call(em, [PostSeed], aclContext);
    await this.call(em, [CommentSeed, DocumentSeed, ArticleSeed], aclContext);

    console.log('✅ ACL seed data created successfully!');
    console.log(`
📊 Created:
   - 6 Users (admin, moderator, alice, bob, charlie, inactive)
   - 6 UserProfiles (public/private)
   - 6 Categories (hierarchical structure)
   - 7 Posts (published/draft/archived)
   - 5 Tags (official/user-created)
   - 7 Comments (approved/pending)
   - 5 Articles (complex scenarios)
   - 5 Documents (public/shared/private)
    `);
  }
}
