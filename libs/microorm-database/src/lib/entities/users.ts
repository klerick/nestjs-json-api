import {
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  OneToOne,
  Collection,
  OneToMany,
  ArrayType,
} from '@mikro-orm/core';

import { Roles, Addresses, IAddresses, Comments, BookList } from './';

export type IUsers = Users;

@Entity({
  tableName: 'users',
})
export class Users {
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

  @ManyToMany(() => Roles, (role) => role.users, {
    owner: true,
    pivotTable: 'users_have_roles',
  })
  public roles = new Collection<Roles>(this);

  @OneToOne(() => Addresses, {
    owner: true,
    fieldName: 'addresses_id',
  })
  public addresses!: IAddresses;

  @OneToOne(() => Users, {
    owner: true,
    nullable: true,
    fieldName: 'manager_id',
  })
  public manager!: IUsers;

  @OneToMany(() => Comments, (comment) => comment.createdBy)
  comments = new Collection<Comments>(this);

  @ManyToMany(() => BookList, (item) => item.users, {
    owner: true,
    pivotTable: 'users_have_book',
  })
  public books = new Collection<BookList>(this);
}
