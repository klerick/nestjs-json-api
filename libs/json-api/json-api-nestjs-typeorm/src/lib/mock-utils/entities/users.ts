import {
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinColumn,
  JoinTable,
  OneToOne,
  OneToMany,
  Entity,
  Column,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

import { Addresses, Roles, Comments, Notes, UserGroups } from './index';

export type IUsers = Users;

@Entity('users')
export class Users {
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
    name: 'test_real',
    type: 'real',
    array: true,
    default: [],
  })
  public testReal!: number[];

  @Column({
    name: 'test_array_null',
    type: 'real',
    array: true,
    nullable: true,
  })
  public testArrayNull!: number[] | null;

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
    width: 1,
    nullable: true,
    default: false,
  })
  public isActive!: boolean;

  @Column({
    name: 'test_date',
    type: 'timestamp with time zone',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public testDate!: Date;

  @Column({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public updatedAt!: Date;

  @OneToOne(() => Addresses, (item) => item.id)
  @JoinColumn({
    name: 'addresses_id',
  })
  public addresses!: Addresses;

  @OneToOne(() => Users, (item) => item.id)
  @JoinColumn({
    name: 'manager_id',
  })
  public manager!: Users;

  @ManyToMany(() => Roles, (item) => item.users)
  @JoinTable({
    name: 'users_have_roles',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'role_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'user_id',
    },
  })
  public roles!: Roles[];

  @OneToMany(() => Comments, (item) => item.createdBy)
  public comments!: Comments[];

  @OneToMany(() => Notes, (item) => item.createdBy)
  public notes!: Notes[];

  @ManyToOne(() => UserGroups, (userGroup) => userGroup.id)
  @JoinColumn({ name: 'user_groups_id' })
  public userGroup!: UserGroups | null;
}
