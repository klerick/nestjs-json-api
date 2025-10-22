import {
  PrimaryGeneratedColumn,
  ManyToMany,
  Entity,
  Column,
} from 'typeorm';

import { PostACL, IPostACL } from '.';

export type ITagACL = TagACL;

@Entity('tag_acl')
export class TagACL {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  public name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  public color!: string; // hex color для UI

  @ManyToMany(() => PostACL, (post) => post.tags)
  public posts!: IPostACL[];
}