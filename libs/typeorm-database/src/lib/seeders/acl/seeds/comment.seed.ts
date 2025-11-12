import { DataSource } from 'typeorm';

import { AclContext } from '../acl.seed';
import { CommentFactory } from '../factory';
import { CommentAcl } from '../../../entities';
import { BaseSeeder } from '../../base-seeder';

export class CommentSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: AclContext): Promise<void> {
    const commentFactory = new CommentFactory(dataSource);
    const [post1, post2, post3, post4, post5, post6] = context.aclContext.posts;
    const bob = context.aclContext.users.find(user => user.login === 'bob')!;
    const charlie = context.aclContext.users.find(user => user.login === 'charlie')!;
    const alice = context.aclContext.users.find(user => user.login === 'alice')!;

    const commentData: Partial<CommentAcl>[] = [{
      post: post1,
      author: bob,
      content: 'Great tutorial! Very helpful for beginners.',
    }, {
      post: post1,
      author: charlie,
      content: 'Thanks for sharing this!',
    }, {
      post: post1,
      author: alice,
      content: 'Glad you found it useful!',
    }, {
      post: post2,
      author: bob,
      content: 'This needs moderation approval',
      isApproved: false, // ACL test: only moderator/admin can see pending
    }, {
      post: post4,
      author: alice,
      content: 'Very informative article on health!',
    }, {
      post: post4,
      author: charlie,
      content: 'Pending comment for moderation',
      isApproved: false,
    }, {
      post: post6,
      author: bob,
      content: 'TypeScript is awesome!',
      isEdited: true, // Edited comment
    }]

    const count = commentData.length;
    context.aclContext.comments = await commentFactory
      .each((comment) => Object.assign(comment, commentData.shift()))
      .createMany(count);
  }
}
