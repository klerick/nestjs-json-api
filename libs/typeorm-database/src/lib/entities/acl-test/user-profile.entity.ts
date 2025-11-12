import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
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
@Entity('acl_user_profiles')
export class UserProfileAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @OneToOne(() => UsersAcl, (user) => user.profile)
  @JoinColumn({
    name: 'user_id',
  })
  public user!: IUsersAcl;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  public firstName!: string | null;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  public lastName!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  public bio!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  public avatar!: string | null;

  /**
   * Private field - only owner or admin can see
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  public phone!: string | null;

  /**
   * Private field - only owner or admin can see
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  public salary!: number | null;

  /**
   * Privacy setting - if false, profile is private
   */
  @Column({
    name: 'is_public',
    type: 'boolean',
    default: true,
  })
  public isPublic!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.user,
  })
  public role!: UserRole;

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
