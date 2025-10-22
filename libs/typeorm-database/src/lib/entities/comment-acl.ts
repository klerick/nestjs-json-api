import {
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Entity,
  Column,
  CreateDateColumn,
} from 'typeorm';

import { PostACL, IPostACL, UserACL, IUserACL } from '.';

export type ICommentACL = CommentACL;

@Entity('comment_acl')
export class CommentACL {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  public text!: string;

  @Column({
    name: 'post_id',
    type: 'int',
    nullable: false,
  })
  public postId!: number;

  @ManyToOne(() => PostACL, (post) => post.comments)
  @JoinColumn({
    name: 'post_id',
  })
  public post!: IPostACL;

  @Column({
    name: 'author_id',
    type: 'int',
    nullable: false,
  })
  public authorId!: number;

  @ManyToOne(() => UserACL, (user) => user.comments)
  @JoinColumn({
    name: 'author_id',
  })
  public author!: IUserACL;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date;
}