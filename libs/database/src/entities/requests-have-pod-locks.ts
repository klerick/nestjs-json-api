import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmpty, IsNotEmpty } from 'class-validator';

export type IRequestsHavePodLocks = RequestsHavePodLocks;

@Entity('requests_have_pod_locks')
export class RequestsHavePodLocks {
  @PrimaryGeneratedColumn()
  public id: number;

  @IsNotEmpty()
  @Column({
    name: 'request_id',
    type: 'int',
    nullable: false,
  })
  public requestId: number;

  @IsNotEmpty()
  @Column({
    name: 'pod_id',
    type: 'int',
    nullable: false,
  })
  public podId: number;

  @IsEmpty()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @IsEmpty()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: true,
    default: 'CURRENT_TIMESTAMP',
  })
  public updatedAt: Date;

  @IsEmpty()
  @Column({
    name: 'external_id',
    type: 'int',
    nullable: true,
    unsigned: true,
    default: 'NULL',
    unique: true,
  })
  public externalId: number;
}
