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
} from 'typeorm';

import {
  Addresses,
  IAddresses,
  Roles,
  IRoles,
  Comments,
  IComments,
  IBookList,
  BookList,
} from '.';

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
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public lastName!: string;

  @Column({
    nullable: false,
    default: false,
    name: 'is_active',
    type: 'boolean',
  })
  public isActive!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
  })
  public updatedAt!: Date;

  @OneToOne(() => Addresses, (item: Addresses) => item.id)
  @JoinColumn({
    name: 'addresses_id',
  })
  public addresses!: IAddresses;

  @OneToOne(() => Users, (item) => item.id)
  @JoinColumn({
    name: 'manager_id',
  })
  public manager!: IUsers;

  @ManyToMany(() => Roles, (item: Roles) => item.users)
  @JoinTable({
    name: 'users_have_roles',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'roles_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'users_id',
    },
  })
  public roles!: IRoles[];

  @OneToMany(() => Comments, (item: Comments) => item.createdBy)
  public comments!: IComments[];

  @ManyToMany(() => BookList, (item: BookList) => item.users)
  @JoinTable({
    name: 'users_have_book',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'book_list_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'users_id',
    },
  })
  public books!: IBookList[];
}
