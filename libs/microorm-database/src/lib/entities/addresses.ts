import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';

import { Users, IUsers } from '.';
import { truncateToSeconds } from '../utils/date';

export type IAddresses = Addresses;

@Entity({
  tableName: 'addresses',
})
export class Addresses {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    columnType: 'varchar',
    length: 70,
    nullable: true,
  })
  public city!: string;

  @Property({
    columnType: 'varchar',
    length: 70,
    nullable: true,
  })
  public state!: string;

  @Property({
    columnType: 'varchar',
    length: 68,
    nullable: true,
  })
  public country!: string;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
  })
  createdAt: Date = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = truncateToSeconds();

  @OneToOne(() => Users, (item) => item.addresses)
  public user!: IUsers;
}
