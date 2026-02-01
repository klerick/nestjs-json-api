import {
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  Collection,
} from '@mikro-orm/core';

import { IUsers, Users } from './users';
import { truncateToSeconds } from '../utils/date';

export type IBookList = BookList;

@Entity({
  tableName: 'book_list',
})
export class BookList {
  @PrimaryKey({
    type: 'uuid',
    defaultRaw: 'uuid_generate_v4()',
  })
  public id!: string;

  @Property({
    type: 'text',
    nullable: false,
  })
  public text!: string;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  createdAt: Date = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = truncateToSeconds();

  @ManyToMany(() => Users, (item) => item.books)
  public users = new Collection<Users>(this);
}
