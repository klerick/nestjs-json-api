import {
  Entity,
  PrimaryKey,
  Property,
  ManyToMany,
  Collection,
} from '@mikro-orm/core';

import { Users, IUsers } from '.';
import { truncateToSeconds } from '../utils/date';

export type IRoles = Roles;

@Entity({
  tableName: 'roles',
})
export class Roles {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 128,
    nullable: true,
    default: 'NULL',
  })
  public name!: string;

  @Property({
    type: 'varchar',
    length: 128,
    nullable: false,
    unique: true,
  })
  public key!: string;

  @Property({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  public isDefault!: boolean;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: true,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
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

  @ManyToMany(() => Users, (item) => item.roles)
  public users = new Collection<Users>(this);
}
