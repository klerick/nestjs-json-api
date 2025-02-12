import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  Collection,
  ManyToMany,
  OneToMany,
  ManyToOne,
  ArrayType,
  Type,
} from '@mikro-orm/core';

import {
  Addresses,
  Roles,
  Comments,
  Notes,
  UserGroups,
  IAddresses,
} from './index';

export type IUsers = Users;

export class MyDateType extends Type<Date, string> {}

@Entity({
  tableName: 'users',
})
export class Users {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'string',
    length: 100,
    unique: true,
  })
  public login!: string;

  @Property({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  public firstName!: string;

  @Property({
    name: 'test_real',
    type: new ArrayType((i) => parseFloat(i)),
    columnType: 'real[]',
    defaultRaw: `ARRAY[]::real[]`,
    default: [],
  })
  public testReal: number[] = [];

  @Property({
    name: 'test_array_null',
    type: new ArrayType((i) => parseFloat(i)),
    columnType: 'real[]',
    nullable: true,
  })
  public testArrayNull!: number[] | null;

  @Property({
    name: 'last_name',
    type: 'string',
    columnType: 'varchar',
    length: 100,
    nullable: true,
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
    name: 'test_date',
    type: Date,
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
  })
  public testDate!: Date;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
  })
  createdAt: Date = new Date();

  @Property({
    length: 0,
    onUpdate: () => new Date(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = new Date();

  @OneToOne(() => Addresses, {
    owner: true,
    fieldName: 'addresses_id',
    nullable: true,
  })
  public addresses!: IAddresses;

  @OneToOne(() => Users, {
    owner: true,
    nullable: true,
    fieldName: 'manager_id',
  })
  public manager!: IUsers;

  @ManyToMany(() => Roles, (role) => role.users, {
    owner: true,
    pivotTable: 'users_have_roles',
    inverseJoinColumn: 'role_id',
    joinColumn: 'user_id',
  })
  public roles = new Collection<Roles>(this);

  @OneToMany(() => Comments, (comment) => comment.createdBy)
  public comments = new Collection<Comments>(this);

  @OneToMany(() => Notes, (item) => item.createdBy)
  public notes = new Collection<Notes>(this);

  @ManyToOne(() => UserGroups, {
    fieldName: 'user_groups_id',
    nullable: true,
  })
  public userGroup!: UserGroups;
}
