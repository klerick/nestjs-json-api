import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Collection,
  Enum,
} from '@mikro-orm/core';
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
@Entity({
  tableName: 'acl_posts',
})
export class PostAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  public title!: string;

  @Property({
    type: 'text',
    nullable: false,
  })
  public content!: string;

  @Property({
    type: 'text',
    nullable: true,
  })
  public excerpt!: string | null;

  /**
   * Author of the post (ownership)
   */
  @ManyToOne(() => UsersAcl, {
    nullable: false,
    fieldName: 'author_id',
  })
  public author!: IUsersAcl;

  /**
   * Category for hierarchical permissions
   */
  @ManyToOne(() => CategoryAcl, {
    nullable: true,
    fieldName: 'category_id',
  })
  public category!: ICategoryAcl | null;

  /**
   * Status for status-based access control
   */
  @Enum(() => PostStatus)
  @Property({
    type: 'varchar',
    length: 20,
    default: PostStatus.DRAFT,
  })
  public status!: PostStatus;

  /**
   * Published flag (alternative to status)
   */
  @Property({
    name: 'is_published',
    type: 'boolean',
    default: false,
  })
  public isPublished!: boolean;

  /**
   * Publish date for time-based access
   */
  @Property({
    length: 0,
    name: 'published_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  public publishedAt!: Date | null;

  /**
   * View count - private field (only author/admin can see)
   */
  @Property({
    name: 'view_count',
    type: 'integer',
    default: 0,
  })
  public viewCount!: number;

  /**
   * Many-to-Many with Tags
   */
  @ManyToMany(() => TagAcl, (tag) => tag.posts, {
    owner: true,
    pivotTable: 'acl_posts_tags',
  })
  public tags = new Collection<ITagAcl>(this);

  /**
   * One-to-Many with Comments
   */
  @OneToMany(() => CommentAcl, (comment) => comment.post)
  public comments = new Collection<ICommentAcl>(this);

  @Property({
    length: 0,
    name: 'created_at',
    nullable: false,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  createdAt: Date = new Date();

  @Property({
    length: 0,
    onUpdate: () => new Date(),
    name: 'updated_at',
    nullable: false,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = new Date();
}
