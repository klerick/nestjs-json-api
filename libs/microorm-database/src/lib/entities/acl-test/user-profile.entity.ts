import { Entity, PrimaryKey, Property, OneToOne, Enum } from '@mikro-orm/core';
import { UsersAcl, IUsersAcl } from './user.entity';


export type IUserProfileAcl = UserProfileAcl;

export enum UserRole {
  admin = 'admin',
  user = 'user',
  moderator = 'moderator',
}

/**
 * UserProfile entity for ACL testing
 * One-to-One relationship with Users
 *
 * ACL Test Cases:
 * - Field-level permissions (UserProfile:select)
 * - Private fields: phone, salary (only owner or admin)
 * - Public fields: firstName, lastName, bio, avatar
 * - Privacy settings (isPublic)
 */
@Entity({
  tableName: 'acl_user_profiles',
})
export class UserProfileAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @OneToOne(() => UsersAcl, {
    owner: true,
    fieldName: 'user_id',
    unique: true,
    nullable: false,
  })
  public user!: IUsersAcl;

  @Property({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  public firstName!: string | null;

  @Property({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  public lastName!: string | null;

  @Property({
    type: 'text',
    nullable: true,
  })
  public bio!: string | null;

  @Property({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  public avatar!: string | null;

  /**
   * Private field - only owner or admin can see
   */
  @Property({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  public phone!: string | null;

  /**
   * Private field - only owner or admin can see
   */
  @Property({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  public salary!: number | null;

  /**
   * Privacy setting - if false, profile is private
   */
  @Property({
    name: 'is_public',
    type: 'boolean',
    default: true,
  })
  public isPublic!: boolean;

  @Enum(() => UserRole)
  @Property({
    type: 'varchar',
    length: 20,
    default: UserRole.user,
  })
  public role!: UserRole;

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
