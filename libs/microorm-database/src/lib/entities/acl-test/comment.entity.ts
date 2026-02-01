import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { UsersAcl, IUsersAcl } from './user.entity';
import { PostAcl } from './post.entity';
import { truncateToSeconds } from '../../utils/date';

export type ICommentAcl = CommentAcl;

/**
 * Comment entity for ACL testing
 * Many-to-One with Post and Users
 *
 * ACL Test Cases:
 * - Nested ownership (comment.authorId === currentUserId)
 * - Moderation (isApproved - only moderator/admin can approve)
 * - Relationship chain (User -> Comment -> Post)
 * - Template: ${@input.postId}, ${post.authorId}
 */
@Entity({
  tableName: 'acl_comments',
})
export class CommentAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  /**
   * Post that this comment belongs to
   */
  @ManyToOne(() => PostAcl, {
    nullable: false,
    fieldName: 'post_id',
  })
  public post!: PostAcl;

  /**
   * Author of the comment (ownership)
   */
  @ManyToOne(() => UsersAcl, {
    nullable: false,
    fieldName: 'author_id',
  })
  public author!: IUsersAcl;

  @Property({
    type: 'text',
    nullable: false,
  })
  public content!: string;

  /**
   * Moderation flag - only moderator/admin can approve
   */
  @Property({
    name: 'is_approved',
    type: 'boolean',
    default: false,
  })
  public isApproved!: boolean;

  /**
   * Edit flag to track if comment was modified
   */
  @Property({
    name: 'is_edited',
    type: 'boolean',
    default: false,
  })
  public isEdited!: boolean;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: false,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  createdAt: Date = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: false,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = truncateToSeconds();
}
