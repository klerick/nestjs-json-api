import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsersAcl, IUsersAcl } from './user.entity';

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
@Entity('acl_articles')
export class ArticleAcl {
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

  /**
   * Primary author (ownership)
   */
  @ManyToOne(() => UsersAcl, (user) => user.authoredArticles, {
    nullable: false,
  })
  @JoinColumn({
    name: 'author_id',
  })
  public author!: IUsersAcl;

  /**
   * Co-authors array for multiple ownership testing
   * ACL: Check if currentUserId in this array
   */
  @Column({
    name: 'co_author_ids',
    type: 'int',
    array: true,
    nullable: false,
    default: () => "'{}'",
  })
  public coAuthorIds!: number[];

  /**
   * Editor (different from author/co-authors)
   * Can edit but not delete
   */
  @ManyToOne(() => UsersAcl, (user) => user.editedArticles, {
    nullable: true,
  })
  @JoinColumn({
    name: 'editor_id',
  })
  public editor!: IUsersAcl | null;

  /**
   * Workflow status
   */
  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  public status!: ArticleStatus;

  /**
   * Visibility control
   */
  @Column({
    type: 'enum',
    enum: ArticleVisibility,
    default: ArticleVisibility.PUBLIC,
  })
  public visibility!: ArticleVisibility;

  /**
   * Metadata as JSON object
   * ACL: Check nested properties like metadata.premium
   */
  @Column({
    type: 'json',
    nullable: false,
    default: '{"readTime": 0, "featured": false, "premium": false}',
  })
  public metadata!: ArticleMetadata;

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
   * Expiration date for temporary access
   * ACL: Check if current time < expiresAt
   */
  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: true,
  })
  public expiresAt!: Date | null;

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
