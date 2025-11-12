import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  ArrayType,
} from '@mikro-orm/core';
import { UsersAcl, IUsersAcl } from './user.entity';

export type IDocumentAcl = DocumentAcl;

/**
 * Document entity for ACL testing - File upload scenarios
 *
 * ACL Test Cases:
 * - Ownership (ownerId === currentUserId)
 * - Shared access (sharedWith.includes(currentUserId))
 * - Public/private toggle (isPublic)
 * - File-specific permissions (read, download, delete)
 * - Template: ${@input.sharedWith}, ${currentUserId}
 */
@Entity({
  tableName: 'acl_documents',
})
export class DocumentAcl {
  @PrimaryKey({
    autoincrement: true,
  })
  public id!: number;

  @Property({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  public filename!: string;

  @Property({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public mimeType!: string;

  /**
   * File size in bytes
   */
  @Property({
    type: 'bigint',
    nullable: false,
  })
  public size!: number;

  /**
   * File path/URL
   */
  @Property({
    type: 'varchar',
    length: 500,
    nullable: false,
  })
  public path!: string;

  /**
   * Owner of the document
   */
  @ManyToOne(() => UsersAcl, {
    nullable: false,
    fieldName: 'owner_id',
  })
  public owner!: IUsersAcl;

  /**
   * Array of user IDs who have access to this document
   * ACL: Check if currentUserId in this array
   */
  @Property({
    name: 'shared_with',
    type: ArrayType<number>,
    columnType: 'integer[]',
    default: [],
  })
  public sharedWith!: number[];

  /**
   * Public access flag
   * If true, anyone can read (but not modify/delete)
   */
  @Property({
    name: 'is_public',
    type: 'boolean',
    default: false,
  })
  public isPublic!: boolean;

  @Property({
    length: 0,
    name: 'uploaded_at',
    nullable: false,
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
    columnType: 'timestamp(0) without time zone',
    type: 'timestamp',
  })
  uploadedAt: Date = new Date();

  @Property({
    length: 0,
    onUpdate: () => new Date(),
    name: 'updated_at',
    nullable: false,
    columnType: 'timestamp(0) without time zone',
    defaultRaw: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date = new Date();
}
