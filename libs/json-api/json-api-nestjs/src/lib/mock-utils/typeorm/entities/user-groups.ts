import { PrimaryGeneratedColumn, OneToMany, Entity, Column } from 'typeorm';

import { IUsers, Users } from './index';

@Entity('user_groups')
export class UserGroups {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  public label!: string;

  @OneToMany(() => Users, (item) => item.userGroup)
  public users!: IUsers[];
}
