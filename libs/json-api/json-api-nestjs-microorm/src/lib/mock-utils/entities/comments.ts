import { Entity, PrimaryKey, Property, Enum, ManyToOne } from '@mikro-orm/core';

export enum CommentKind {
  Comment = 'COMMENT',
  Message = 'MESSAGE',
  Note = 'NOTE',
}

import { Users, IUsers } from './index';

export type IComments = Comments;

@Entity({
  tableName: 'comments',
})
export class Comments {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    columnType: 'text',
  })
  public text!: string;

  @Enum({ items: () => CommentKind, nativeEnumName: 'comment_kind_enum' })
  public kind!: CommentKind;

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

  @ManyToOne(() => Users, {
    // #TODO need add chaeck for nullable relation to zod
    nullable: true,
    fieldName: 'created_by',
  })
  createdBy!: IUsers;
}
