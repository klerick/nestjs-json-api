import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsersAcl, IUsersAcl } from './user.entity';
import { PostAcl } from './post.entity';

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
@Entity('acl_comments')
export class CommentAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  /**
   * Post that this comment belongs to
   */
  @ManyToOne(() => PostAcl, (post) => post.comments, {
    nullable: false,
  })
  @JoinColumn({
    name: 'post_id',
  })
  public post!: PostAcl;

  /**
   * Author of the comment (ownership)
   */
  @ManyToOne(() => UsersAcl, (user) => user.aclComments, {
    nullable: false,
  })
  @JoinColumn({
    name: 'author_id',
  })
  public author!: IUsersAcl;

  @Column({
    type: 'text',
    nullable: false,
  })
  public content!: string;

  /**
   * Moderation flag - only moderator/admin can approve
   */
  @Column({
    name: 'is_approved',
    type: 'boolean',
    default: false,
  })
  public isApproved!: boolean;

  /**
   * Edit flag to track if comment was modified
   */
  @Column({
    name: 'is_edited',
    type: 'boolean',
    default: false,
  })
  public isEdited!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date = new Date();

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date = new Date();
}
