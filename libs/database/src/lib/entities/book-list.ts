import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmpty, IsNotEmpty } from 'class-validator';
import { IUsers, Users } from './users';

export type IBookList = BookList;

@Entity('book_list')
export class BookList {
  @PrimaryGeneratedColumn()
  public id!: string;

  @IsNotEmpty()
  @Column({
    type: 'text',
    nullable: false,
  })
  public text!: string;

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

  @ManyToMany(() => Users, (item) => item.books)
  public users!: IUsers[];
}
