import { DataSource } from 'typeorm';
import { AclContext } from '../acl.seed';
import { PostFactory } from '../factory';
import { PostAcl, PostStatus, TagAcl } from '../../../entities';
import { BaseSeeder } from '../../base-seeder';


export class PostSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: AclContext): Promise<void> {
    const postFactory = new PostFactory(dataSource);
    const alice = context.aclContext.users.find(
      (user) => user.login === 'alice'
    )!;
    const bob = context.aclContext.users.find((user) => user.login === 'bob')!;
    const charlie = context.aclContext.users.find(
      (user) => user.login === 'charlie'
    )!;
    const webDevCategory = context.aclContext.categories.find(
      (category) => category.slug === 'web-development'
    )!;
    const aiCategory = context.aclContext.categories.find(
      (category) => category.slug === 'artificial-intelligence'
    )!;
    const healthCategory = context.aclContext.categories.find(
      (category) => category.slug === 'health-fitness'
    )!;
    const techCategory = context.aclContext.categories.find(
      (category) => category.slug === 'technology'
    )!;

    const tagNestJS = context.aclContext.tags.find(
      (tag) => tag.slug === 'nestjs'
    )!;
    const tagTypeScript = context.aclContext.tags.find(
      (tag) => tag.slug === 'typescript'
    )!;
    const tagUserCreated = context.aclContext.tags.find(
      (tag) => tag.slug === 'tutorial'
    )!;
    const tagMachineLearning = context.aclContext.tags.find(
      (tag) => tag.slug === 'machine-learning'
    )!;
    const tagHealthy = context.aclContext.tags.find(
      (tag) => tag.slug === 'healthy-living'
    )!;
    const postData: Partial<PostAcl>[] = [
      {
        title: 'Getting Started with NestJS',
        author: alice,
        tags: [tagNestJS, tagTypeScript, tagUserCreated],
        category: webDevCategory,
      },
      {
        title: 'Machine Learning Basics',
        author: alice,
        tags: [tagMachineLearning],
        category: aiCategory,
      },
      {
        title: 'My Draft Post',
        author: alice,
        tags: [tagNestJS],
        category: webDevCategory,
        status: PostStatus.DRAFT, // ACL test: only author/admin can see
        isPublished: false,
        publishedAt: null,
        viewCount: 0,
      },
      {
        title: 'Healthy Living Tips',
        author: bob,
        tags: [tagHealthy],
        category: healthCategory,
      },
      {
        title: "Bob's Private Draft",
        excerpt: null,
        author: bob,
        category: healthCategory,
        status: PostStatus.DRAFT,
        isPublished: false,
        publishedAt: null,
        viewCount: 0,
      },
      {
        title: 'TypeScript Best Practices',
        author: charlie,
        category: webDevCategory,
        tags: [tagTypeScript, tagUserCreated],
      },
      {
        title: 'Archived Post',
        author: charlie,
        category: techCategory,
        status: PostStatus.ARCHIVED, // ACL test: archived posts
        isPublished: false,
      },
    ];
    const count = postData.length;
    context.aclContext.posts = await postFactory
      .each((post) => {
        const { tags, ...other } = postData.shift()!;
        Object.assign(post, other);
        post.tags = tags as TagAcl[];
      })
      .createMany(count);
  }
}
