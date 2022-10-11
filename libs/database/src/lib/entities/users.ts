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
  Length,
  IsNotEmpty,
  IsOptional,
  IsEmpty,
  IsBoolean,
} from 'class-validator';

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

  @IsNotEmpty()
  @Length(5, 100)
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  public login!: string;

  @IsOptional()
  @Length(5, 100)
  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public firstName!: string;

  @IsOptional()
  @Length(5, 100)
  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'NULL',
  })
  public lastName!: string;

  @IsOptional()
  @IsBoolean()
  @Column({
    name: 'is_active',
    type: 'boolean',
    width: 1,
    nullable: true,
    default: false,
  })
  public isActive!: boolean;

  @IsEmpty()
  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date;

  @IsEmpty()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;

  @OneToOne(() => Addresses, (item) => item.id)
  @IsNotEmpty()
  @JoinColumn({
    name: 'addresses_id',
  })
  public addresses!: IAddresses;

  @OneToOne(() => Users, (item) => item.id)
  @IsOptional()
  @JoinColumn({
    name: 'manager_id',
  })
  public manager!: IUsers;

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
  public roles!: IRoles[];

  @OneToMany(() => Comments, (item) => item.createdBy)
  public comments!: IComments[];

  @ManyToMany(() => BookList, (item) => item.users)
  @JoinTable({
    name: 'users_have_book',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'book_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'user_id',
    },
  })
  public books!: IBookList[];
}
