import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  UpdateDateColumn,
} from 'typeorm';
import { UsersAcl, IUsersAcl } from './user.entity';
import { CategoryAcl, ICategoryAcl } from './category.entity';
import { TagAcl, ITagAcl } from './tag.entity';
import { CommentAcl, ICommentAcl } from './comment.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export type IPostAcl = PostAcl;

/**
 * Post entity for ACL testing
 * Many-to-One with Users (author) and Category
 * Many-to-Many with Tag
 * One-to-Many with Comment
 *
 * ACL Test Cases:
 * - Ownership (authorId === currentUserId)
 * - Status-based access (only published posts for guest)
 * - Conditional access (owner OR admin OR moderator)
 * - Field-level permissions (Post:select - viewCount only for author/admin)
 * - Relationship permissions (Post:include - comments, tags)
 * - Template: ${currentUserId}, ${@input.authorId}, ${@input.status}
 */
@Entity('acl_posts')
export class PostAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  public title!: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  public content!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  public excerpt!: string | null;

  /**
   * Author of the post (ownership)
   */
  @ManyToOne(() => UsersAcl, (user) => user.posts, {
    nullable: false,
  })
  @JoinColumn({
    name: 'author_id',
  })
  public author!: IUsersAcl;

  /**
   * Category for hierarchical permissions
   */
  @ManyToOne(() => CategoryAcl, {
    nullable: true,
  })
  @JoinColumn({
    name: 'category_id',
  })
  public category!: ICategoryAcl | null;

  /**
   * Status for status-based access control
   */
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  public status!: PostStatus;

  /**
   * Published flag (alternative to status)
   */
  @Column({
    name: 'is_published',
    type: 'boolean',
    default: false,
  })
  public isPublished!: boolean;

  /**
   * Publish date for time-based access
   */
  @Column({
    name: 'published_at',
    type: 'timestamp',
    nullable: true,
  })
  public publishedAt!: Date | null;

  /**
   * View count - private field (only author/admin can see)
   */
  @Column({
    name: 'view_count',
    type: 'integer',
    default: 0,
  })
  public viewCount!: number;

  /**
   * Many-to-Many with Tags
   */
  @ManyToMany(() => TagAcl, (tag) => tag.posts)
  @JoinTable({
    name: 'acl_posts_tags',
    joinColumn: {
      name: 'post_acl_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_acl_id',
      referencedColumnName: 'id',
    },
  })
  public tags!: ITagAcl[];

  /**
   * One-to-Many with Comments
   */
  @OneToMany(() => CommentAcl, (comment) => comment.post)
  public comments!: ICommentAcl[];

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
