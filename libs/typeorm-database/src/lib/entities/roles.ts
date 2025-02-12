import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  ManyToMany,
  UpdateDateColumn,
} from 'typeorm';

import { Users, IUsers } from '.';

export type IRoles = Roles;

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
    default: 'NULL',
  })
  public name!: string;

  @Column({
    type: 'varchar',
    length: 128,
    nullable: false,
    unique: true,
  })
  public key!: string;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: 'false',
  })
  public isDefault!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public updatedAt!: Date;

  @ManyToMany(() => Users, (item) => item.roles)
  public users!: IUsers[];
}
