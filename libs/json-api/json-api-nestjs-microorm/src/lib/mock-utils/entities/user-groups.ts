import {
  PrimaryKey,
  OneToMany,
  Entity,
  Property,
  Collection,
} from '@mikro-orm/core';

import { Users } from './index';

@Entity({
  tableName: 'user_groups',
})
export class UserGroups {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'string',
    length: 50,
    unique: true,
    columnType: 'varchar',
  })
  public label!: string;

  @OneToMany(() => Users, (item) => item.userGroup)
  public users = new Collection<Users>(this);
}
