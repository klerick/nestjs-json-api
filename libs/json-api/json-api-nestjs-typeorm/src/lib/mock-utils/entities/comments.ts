import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

export enum CommentKind {
  Comment = 'COMMENT',
  Message = 'MESSAGE',
  Note = 'NOTE',
}

import { Users, IUsers } from './index';

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

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public updatedAt!: Date;

  @ManyToOne(() => Users, (item) => item.id)
  @JoinColumn({
    name: 'created_by',
  })
  public createdBy!: IUsers;
}
