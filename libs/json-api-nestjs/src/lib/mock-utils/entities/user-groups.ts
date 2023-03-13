import { PrimaryGeneratedColumn, OneToMany, Entity, Column } from 'typeorm';
import { IsNotEmpty, Length } from 'class-validator';

import { IUsers, Users } from '.';

@Entity('user_groups')
export class UserGroups {
  @PrimaryGeneratedColumn()
  public id: number;

  @IsNotEmpty()
  @Length(3, 50)
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  public label: string;

  @OneToMany(() => Users, (item) => item.userGroup)
  public users: IUsers[];
}
