import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
  ArrayType,
} from '@mikro-orm/core';
import { UsersAcl, IUsersAcl } from './user.entity';
import { truncateToSeconds } from '../../utils/date';

export enum ArticleStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
}

export enum ArticleVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

export interface ArticleMetadata {
  readTime: number;
  featured: boolean;
  premium: boolean;
}

export type IArticleAcl = ArticleAcl;

/**
 * Article entity for ACL testing - Complex scenarios
 *
 * ACL Test Cases:
 * - Multiple owners (authorId OR coAuthorIds.includes(userId))
 * - Array conditions (checking if userId in coAuthorIds array)
 * - Nested object conditions (metadata.premium)
 * - Time-based access (expiresAt > now)
 * - Complex workflows (draft -> review -> published)
 * - Editor role (separate from author)
 * - Template: ${@input.coAuthorIds}, ${metadata.premium}, ${currentTime}
 */
@Entity({
  tableName: 'acl_articles',
})
export class ArticleAcl {
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

  /**
   * Primary author (ownership)
   */
  @ManyToOne(() => UsersAcl, {
    nullable: false,
    fieldName: 'author_id',
  })
  public author!: IUsersAcl;

  /**
   * Co-authors array for multiple ownership testing
   * ACL: Check if currentUserId in this array
   */
  @Property({
    name: 'co_author_ids',
    type: ArrayType<number>,
    columnType: 'integer[]',
    default: [],
  })
  public coAuthorIds!: number[];

  /**
   * Editor (different from author/co-authors)
   * Can edit but not delete
   */
  @ManyToOne(() => UsersAcl, {
    nullable: true,
    fieldName: 'editor_id',
  })
  public editor!: IUsersAcl | null;

  /**
   * Workflow status
   */
  @Enum(() => ArticleStatus)
  @Property({
    type: 'varchar',
    length: 20,
    default: ArticleStatus.DRAFT,
  })
  public status!: ArticleStatus;

  /**
   * Visibility control
   */
  @Enum(() => ArticleVisibility)
  @Property({
    type: 'varchar',
    length: 20,
    default: ArticleVisibility.PUBLIC,
  })
  public visibility!: ArticleVisibility;

  /**
   * Metadata as JSON object
   * ACL: Check nested properties like metadata.premium
   */
  @Property({
    type: 'json',
    nullable: false,
    default: '{"readTime": 0, "featured": false, "premium": false}',
  })
  public metadata!: ArticleMetadata;

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
   * Expiration date for temporary access
   * ACL: Check if current time < expiresAt
   */
  @Property({
    length: 0,
    name: 'expires_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  public expiresAt!: Date | null;

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
