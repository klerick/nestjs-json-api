import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { truncateToSeconds } from '../../utils/date';

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
@Entity({
  tableName: 'acl_categories',
})
export class CategoryAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public name!: string;

  @Property({
    type: 'varchar',
    length: 150,
    nullable: false,
    unique: true,
  })
  public slug!: string;

  /**
   * Self-referencing parent category
   */
  @ManyToOne(() => CategoryAcl, {
    nullable: true,
    fieldName: 'parent_id',
  })
  public parent!: CategoryAcl | null;

  /**
   * Self-referencing children categories
   */
  @OneToMany(() => CategoryAcl, (category) => category.parent)
  public children = new Collection<CategoryAcl>(this);

  /**
   * Depth level in hierarchy
   * 0 = root category, 1 = first level child, etc.
   */
  @Property({
    type: 'integer',
    default: 0,
  })
  public level!: number;

  /**
   * Active/inactive flag for access control
   */
  @Property({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  public isActive!: boolean;

  @Property({
    type: 'text',
    nullable: true,
  })
  public description!: string | null;

  @Property({
    length: 0,
    name: 'created_at',
    nullable: false,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  createdAt: Date = truncateToSeconds();

  @Property({
    length: 0,
    onUpdate: () => truncateToSeconds(),
    name: 'updated_at',
    nullable: false,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = truncateToSeconds();
}
