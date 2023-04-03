import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmpty, IsNotEmpty } from 'class-validator';

import { Users, IUsers } from '.';

@Entity('notes')
export class Notes {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column({
    type: 'text',
    nullable: false,
  })
  public text: string;

  @IsEmpty()
  @Column({
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

  @ManyToOne(() => Users, (item) => item.notes)
  @IsNotEmpty()
  @JoinColumn({
    name: 'created_by',
  })
  public createdBy: IUsers;
}
