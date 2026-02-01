import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  ManyToMany,
  Collection,
} from '@mikro-orm/core';
import { UsersAcl, IUsersAcl } from './user.entity';
import { PostAcl } from './post.entity';
import { truncateToSeconds } from '../../utils/date';

export type ITagAcl = TagAcl;

/**
 * Tag entity for ACL testing
 * Many-to-Many relationship with Post
 *
 * ACL Test Cases:
 * - Many-to-Many relationship (Post <-> Tag)
 * - Creator ownership (createdById === currentUserId)
 * - Privileged entities (isOfficial - only admin can create)
 * - Template: ${currentUserId}, ${@input.createdById}
 */
@Entity({
  tableName: 'acl_tags',
})
export class TagAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public name!: string;

  @Property({
    type: 'varchar',
    length: 150,
    nullable: false,
    unique: true,
  })
  public slug!: string;

  /**
   * User who created this tag
   */
  @ManyToOne(() => UsersAcl, {
    nullable: false,
    fieldName: 'created_by_id',
  })
  public createdBy!: IUsersAcl;

  /**
   * Official tags can only be created by admins
   * Regular users can create non-official tags
   */
  @Property({
    name: 'is_official',
    type: 'boolean',
    default: false,
  })
  public isOfficial!: boolean;

  @Property({
    type: 'text',
    nullable: true,
  })
  public description!: string | null;

  /**
   * Many-to-Many relationship with Post
   */
  @ManyToMany(() => PostAcl, (post) => post.tags)
  public posts = new Collection<PostAcl>(this);

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
