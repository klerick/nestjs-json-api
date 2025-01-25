import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { IUsers, Users } from './users';

export type IBookList = BookList;

@Entity('book_list')
export class BookList {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  public text!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;

  @ManyToMany(() => Users, (item) => item.books)
  public users!: IUsers[];
}
