import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type IContextTestAcl = ContextTestAcl;

@Entity('acl_context_test')
export class ContextTestAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'json',
    nullable: false,
    default: '{}',
  })
  aclRules!: { rules: Record<string, unknown>[] };

  @Column({
    type: 'json',
    nullable: false,
    default: '{}',
  })
  context!: Record<string, unknown>;
}
