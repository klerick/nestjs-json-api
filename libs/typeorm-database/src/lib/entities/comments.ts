import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  RelationId,
} from 'typeorm';

export enum CommentKind {
  Comment = 'COMMENT',
  Message = 'MESSAGE',
  Note = 'NOTE',
}

import { Users, IUsers } from '.';
import {
  JsonApiReadOnly,
  JsonApiImmutable,
  JsonApiReadOnlyField,
  JsonApiImmutableField,
} from '@klerick/json-api-nestjs';

export type IComments = Comments;

@Entity('comments')
export class Comments {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  public text!: string;

  @Column({
    type: 'enum',
    enum: CommentKind,
    nullable: false,
  })
  public kind!: CommentKind;

  @JsonApiReadOnly()
  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date & JsonApiReadOnlyField;

  @JsonApiReadOnly()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date & JsonApiReadOnlyField;

  @ManyToOne(() => Users, (item) => item.id)
  @JoinColumn({
    name: 'created_by',
  })
  public createdBy!: IUsers;

  @RelationId((item: Comments) => item.createdBy, 'created_by')
  public createdById!: number;
}
