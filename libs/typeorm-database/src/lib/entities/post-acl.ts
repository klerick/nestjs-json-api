import {
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserACL, IUserACL, CommentACL, ICommentACL, TagACL, ITagACL } from '.';

export type IPostACL = PostACL;

@Entity('post_acl')
export class PostACL {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  public title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  public content!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public published!: boolean;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  public private!: boolean;

  @Column({
    name: 'author_id',
    type: 'int',
    nullable: false,
  })
  public authorId!: number;

  @ManyToOne(() => UserACL, (user) => user.posts)
  @JoinColumn({
    name: 'author_id',
  })
  public author!: IUserACL;

  @OneToMany(() => CommentACL, (comment) => comment.post)
  public comments!: ICommentACL[];

  @ManyToMany(() => TagACL, (tag) => tag.posts)
  @JoinTable({
    name: 'post_acl_tags',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'tag_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'post_id',
    },
  })
  public tags!: ITagACL[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;
}