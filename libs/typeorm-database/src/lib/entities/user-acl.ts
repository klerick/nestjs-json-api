import {
  PrimaryGeneratedColumn,
  OneToMany,
  Entity,
  Column,
} from 'typeorm';

import { PostACL, IPostACL, CommentACL, ICommentACL } from '.';

export type IUserACL = UserACL;

@Entity('user_acl')
export class UserACL {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public email!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'user',
  })
  public role!: string; // 'admin' | 'user'

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  public isActive!: boolean;

  @OneToMany(() => PostACL, (post) => post.author)
  public posts!: IPostACL[];

  @OneToMany(() => CommentACL, (comment) => comment.author)
  public comments!: ICommentACL[];
}