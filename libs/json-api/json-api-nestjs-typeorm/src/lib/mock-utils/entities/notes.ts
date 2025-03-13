import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

import { Users, IUsers } from './index';

@Entity('notes')
export class Notes {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  public text!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  public updatedAt!: Date;

  @ManyToOne(() => Users, (item) => item.notes)
  @JoinColumn({
    name: 'created_by',
  })
  public createdBy!: IUsers;
}
