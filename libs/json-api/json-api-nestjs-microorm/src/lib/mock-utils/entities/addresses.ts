import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  ArrayType,
} from '@mikro-orm/core';

import { Users, IUsers } from './index';

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
    name: 'array_field',
    type: ArrayType,
    columnType: 'varchar[]',
    nullable: true,
  })
  public arrayField!: string[];

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
  })
  createdAt: Date = new Date();

  @Property({
    length: 0,
    onUpdate: () => new Date(),
    name: 'updated_at',
    nullable: true,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = new Date();

  @OneToOne(() => Users, (item) => item.addresses)
  public user!: IUsers;
}
