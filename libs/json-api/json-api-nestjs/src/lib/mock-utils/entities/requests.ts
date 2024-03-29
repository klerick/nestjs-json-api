import {
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { Pods, IPods } from './index';

export type IRequests = Requests;

@Entity('requests')
export class Requests {
  @PrimaryGeneratedColumn()
  public id!: number;

  @CreateDateColumn({
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

  @ManyToMany(() => Pods, (item) => item.lockedRequests)
  @JoinTable({
    name: 'requests_have_pod_locks',
    inverseJoinColumn: {
      referencedColumnName: 'id',
      name: 'pod_id',
    },
    joinColumn: {
      referencedColumnName: 'id',
      name: 'request_id',
    },
  })
  public podLocks!: IPods[];
}
