import {
  AfterLoad,
  BeforeInsert,
  BeforeRemove,
  BeforeUpdate,
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

  @AfterLoad()
  protected getRequestId() {
    this.requestId = this.request_id;
  }

  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  protected setRequestId() {
    if (this.requestId) {
      this.request_id = this.requestId;
    }
  }

  public requestId: number;

  @AfterLoad()
  protected getPodId() {
    this.podId = this.pod_id;
  }

  @BeforeInsert()
  @BeforeUpdate()
  @BeforeRemove()
  protected setPodId() {
    if (this.podId) {
      this.pod_id = this.podId;
    }
  }

  public podId: number;

  @IsNotEmpty()
  @Column({
    name: 'request_id',
    type: 'int',
    nullable: false,
  })
  protected request_id: number;

  @IsNotEmpty()
  @Column({
    name: 'pod_id',
    type: 'int',
    nullable: false,
  })
  protected pod_id: number;

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
