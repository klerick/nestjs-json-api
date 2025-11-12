import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export type IContextTestAcl = ContextTestAcl

@Entity({
  tableName: 'acl_context_test',
})
export class ContextTestAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;
  @Property({
    type: 'json',
    nullable: false,
    default: '{}',
  })
  aclRules!: {rules: Record<string, unknown>[]}

  @Property({
    type: 'json',
    nullable: false,
    default: '{}',
  })
  context!: Record<string, unknown>
}




