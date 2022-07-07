import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmpty, IsNotEmpty, Length } from 'class-validator';
import { IRequests, Requests } from '.';

export type IPods = Pods;

@Entity('pods')
export class Pods {
  @PrimaryGeneratedColumn()
  public id: number;

  @IsNotEmpty()
  @Length(3, 50)
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  public name: string;

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

  @ManyToMany(() => Requests, (item) => item.podLocks)
  public lockedRequests: IRequests[];
}
