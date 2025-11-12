import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';

import { IUserProfileAcl, UserProfileAcl } from './user-profile.entity';
import { IPostAcl, PostAcl } from './post.entity';
import { CommentAcl, ICommentAcl } from './comment.entity';
import { TagAcl, ITagAcl } from './tag.entity';
import { ArticleAcl, IArticleAcl } from './article.entity';
import { DocumentAcl, IDocumentAcl } from './document.entity';

export type IUsersAcl = UsersAcl;

@Entity('acl_users')
export class UsersAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  public login!: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public firstName!: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public lastName!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  public isActive!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date = new Date();

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date = new Date();

  // ========================================
  // ACL Test Entities Relationships
  // ========================================

  /**
   * One-to-One reverse relationship with UserProfile
   * User has one profile
   */
  @OneToOne(() => UserProfileAcl, (profile) => profile.user)
  public profile!: IUserProfileAcl;

  /**
   * One-to-Many: User authored posts
   */
  @OneToMany(() => PostAcl, (post) => post.author)
  public posts!: IPostAcl[];

  /**
   * One-to-Many: User authored comments
   */
  @OneToMany(() => CommentAcl, (comment) => comment.author)
  public aclComments!: ICommentAcl[];

  /**
   * One-to-Many: Tags created by user
   */
  @OneToMany(() => TagAcl, (tag) => tag.createdBy)
  public createdTags!: ITagAcl[];

  /**
   * One-to-Many: Articles authored by user
   */
  @OneToMany(() => ArticleAcl, (article) => article.author)
  public authoredArticles!: IArticleAcl[];

  /**
   * One-to-Many: Articles edited by user
   */
  @OneToMany(() => ArticleAcl, (article) => article.editor)
  public editedArticles!: IArticleAcl[];

  /**
   * One-to-Many: Documents owned by user
   */
  @OneToMany(() => DocumentAcl, (document) => document.owner)
  public documents!: IDocumentAcl[];
}
