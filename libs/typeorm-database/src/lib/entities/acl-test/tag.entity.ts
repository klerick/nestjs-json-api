import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsersAcl, IUsersAcl } from './user.entity';
import { PostAcl } from './post.entity';

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
@Entity('acl_tags')
export class TagAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public name!: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    unique: true,
  })
  public slug!: string;

  /**
   * User who created this tag
   */
  @ManyToOne(() => UsersAcl, (user) => user.createdTags, {
    nullable: false,
  })
  @JoinColumn({
    name: 'created_by_id',
  })
  public createdBy!: IUsersAcl;

  /**
   * Official tags can only be created by admins
   * Regular users can create non-official tags
   */
  @Column({
    name: 'is_official',
    type: 'boolean',
    default: false,
  })
  public isOfficial!: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description!: string | null;

  /**
   * Many-to-Many relationship with Post
   */
  @ManyToMany(() => PostAcl, (post) => post.tags)
  public posts!: PostAcl[];

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
