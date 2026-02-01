import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
  Opt,
} from '@mikro-orm/core';

export enum CommentKind {
  Comment = 'COMMENT',
  Message = 'MESSAGE',
  Note = 'NOTE',
}

import { Users, IUsers } from '.';
import { JsonApiReadOnly, JsonApiReadOnlyField } from '@klerick/json-api-nestjs';
import { truncateToSeconds } from '../utils/date';

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
  @JsonApiReadOnly()
  createdAt: Date & Opt & JsonApiReadOnlyField = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  @JsonApiReadOnly()
  updatedAt: Date & Opt & JsonApiReadOnlyField = truncateToSeconds();

  @ManyToOne(() => Users, {
    nullable: true,
  })
  createdBy!: IUsers;

  @Property({ persist: false })
  public createdById!: number;
}
