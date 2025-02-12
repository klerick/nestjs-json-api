import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users_have_roles')
export class UsersHaveRoles {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    name: 'users_id',
    type: 'int',
    nullable: false,
    unique: false,
  })
  public userId!: number;

  @Column({
    name: 'roles_id',
    type: 'int',
    nullable: false,
    unique: false,
  })
  public roleId!: number;

  @Column({
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
}
