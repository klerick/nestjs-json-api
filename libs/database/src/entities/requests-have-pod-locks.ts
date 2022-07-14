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

  public set requestId(id){
    this.request_id = id
  }

  public get requestId(){
    return this.request_id;
  }

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

  public set podId(id){
    this.pod_id = id
  }

  public get podId(): number{
    return this.request_id;
  }

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
