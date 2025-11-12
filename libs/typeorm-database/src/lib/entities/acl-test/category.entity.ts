import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ICategoryAcl = CategoryAcl;

/**
 * Category entity for ACL testing
 * Self-referencing hierarchical structure
 *
 * ACL Test Cases:
 * - Hierarchical permissions (parent -> children access)
 * - Self-referencing relationships
 * - Depth-based access control (level)
 * - Active/inactive categories
 * - Template: ${@input.parentId}, ${category.parent.id}
 */
@Entity('acl_categories')
export class CategoryAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public name!: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    unique: true,
  })
  public slug!: string;

  /**
   * Self-referencing parent category
   */
  @ManyToOne(() => CategoryAcl, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({
    name: 'parent_id',
  })
  public parent!: CategoryAcl | null;

  /**
   * Self-referencing children categories
   */
  @OneToMany(() => CategoryAcl, (category) => category.parent)
  public children!: CategoryAcl[];

  /**
   * Depth level in hierarchy
   * 0 = root category, 1 = first level child, etc.
   */
  @Column({
    type: 'integer',
    default: 0,
  })
  public level!: number;

  /**
   * Active/inactive flag for access control
   */
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  public isActive!: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description!: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date = new Date();

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date = new Date();
}
