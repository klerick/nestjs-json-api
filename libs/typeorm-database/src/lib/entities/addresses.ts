import {
  PrimaryGeneratedColumn,
  OneToOne,
  Column,
  Entity,
  UpdateDateColumn,
} from 'typeorm';

import { Users, IUsers } from '.';

export type IAddresses = Addresses;

@Entity('addresses')
export class Addresses {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 70,
    nullable: true,
    default: 'NULL',
  })
  public city!: string;

  @Column({
    type: 'varchar',
    length: 70,
    nullable: true,
    default: 'NULL',
  })
  public state!: string;

  @Column({
    type: 'varchar',
    length: 68,
    nullable: true,
    default: 'NULL',
  })
  public country!: string;

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

  @OneToOne(() => Users, (item) => item.addresses)
  public user!: IUsers;
}
