import { PrimaryKey, Property, Entity, ManyToOne } from '@mikro-orm/core';

import { Users, IUsers } from './index';

@Entity({
  tableName: 'notes',
})
export class Notes {
  @PrimaryKey({
    type: 'uuid',
    defaultRaw: 'gen_random_uuid()',
  })
  public id!: string;

  @Property({
    type: 'text',
    nullable: false,
  })
  public text!: string;

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

  @ManyToOne(() => Users, {
    fieldName: 'created_by',
  })
  public createdBy!: IUsers;
}
