import { DataSource } from 'typeorm';
import { AclContext } from '../acl.seed';
import { TagFactory } from '../factory';
import { TagAcl } from '../../../entities';
import { BaseSeeder } from '../../base-seeder';

export class TagSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: AclContext): Promise<void> {
    const tagFactory = new TagFactory(dataSource);
    const admin = context.aclContext.users.find(
      (user) => user.login === 'admin'
    )!;
    const moderator = context.aclContext.users.find(
      (user) => user.login === 'moderator'
    )!;
    const alice = context.aclContext.users.find(
      (user) => user.login === 'alice'
    )!;
    const tagData: Partial<TagAcl>[] = [
      {
        name: 'NestJS',
        slug: 'nestjs',
        description: 'NestJS framework',
        createdBy: admin,
        isOfficial: true,
      },
      {
        name: 'TypeScript',
        slug: 'typescript',
        description: 'TypeScript language',
        createdBy: admin,
        isOfficial: true,
      },
      {
        name: 'Machine Learning',
        slug: 'machine-learning',
        description: 'ML and AI',
        createdBy: admin,
        isOfficial: true,
      },
      {
        name: 'Healthy Living',
        slug: 'healthy-living',
        description: 'Health and wellness',
        createdBy: moderator,
      },
      {
        name: 'Tutorial',
        slug: 'tutorial',
        description: 'Tutorial posts',
        createdBy: alice,
        isOfficial: false, // ACL test: user-created tags
      },
    ];

    const count = tagData.length;
    context.aclContext.tags = await tagFactory
      .each((tag) => Object.assign(tag, tagData.shift()))
      .createMany(count);
  }
}
