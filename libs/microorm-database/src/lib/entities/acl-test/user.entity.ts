import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  Collection,
  OneToMany,
} from '@mikro-orm/core';

//
import { IUserProfileAcl, UserProfileAcl } from './user-profile.entity';
import { IPostAcl, PostAcl } from './post.entity';
import { CommentAcl, ICommentAcl } from './comment.entity';
import { TagAcl, ITagAcl } from './tag.entity';
import { ArticleAcl, IArticleAcl } from './article.entity';
import { DocumentAcl, IDocumentAcl } from './document.entity';
import { truncateToSeconds } from '../../utils/date';

export type IUsersAcl = UsersAcl;

@Entity({
  tableName: 'acl_users',
})
export class UsersAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  public login!: string;

  @Property({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public firstName!: string;

  @Property({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public lastName!: string;

  @Property({
    name: 'is_active',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  public isActive!: boolean;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  createdAt: Date = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = truncateToSeconds();

  // ========================================
  // ACL Test Entities Relationships
  // ========================================

  /**
   * One-to-One reverse relationship with UserProfile
   * User has one profile
   */
  @OneToOne(() => UserProfileAcl, 'user')
  public profile!: IUserProfileAcl;

  /**
   * One-to-Many: User authored posts
   */
  @OneToMany(() => PostAcl, 'author')
  public posts = new Collection<IPostAcl>(this);

  /**
   * One-to-Many: User authored comments
   */
  @OneToMany(() => CommentAcl, 'author')
  public aclComments = new Collection<ICommentAcl>(this);

  /**
   * One-to-Many: Tags created by user
   */
  @OneToMany(() => TagAcl, 'createdBy')
  public createdTags = new Collection<ITagAcl>(this);

  /**
   * One-to-Many: Articles authored by user
   */
  @OneToMany(() => ArticleAcl, 'author')
  public authoredArticles = new Collection<IArticleAcl>(this);

  /**
   * One-to-Many: Articles edited by user
   */
  @OneToMany(() => ArticleAcl, 'editor')
  public editedArticles = new Collection<IArticleAcl>(this);

  /**
   * One-to-Many: Documents owned by user
   */
  @OneToMany(() => DocumentAcl, 'owner')
  public documents = new Collection<IDocumentAcl>(this);
}
