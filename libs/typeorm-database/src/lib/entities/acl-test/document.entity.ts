import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
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
@Entity('acl_documents')
export class DocumentAcl {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  public filename!: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  public mimeType!: string;

  /**
   * File size in bytes
   */
  @Column({
    type: 'bigint',
    nullable: false,
  })
  public size!: number;

  /**
   * File path/URL
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
  })
  public path!: string;

  /**
   * Owner of the document
   */
  @ManyToOne(() => UsersAcl, (user) => user.documents, {
    nullable: false,
  })
  @JoinColumn({
    name: 'owner_id',
  })
  public owner!: IUsersAcl;

  /**
   * Array of user IDs who have access to this document
   * ACL: Check if currentUserId in this array
   */
  @Column({
    name: 'shared_with',
    type: 'simple-array',
    nullable: false,
    default: '',
  })
  public sharedWith!: number[];

  /**
   * Public access flag
   * If true, anyone can read (but not modify/delete)
   */
  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
  })
  public isPublic!: boolean;

  @Column({
    name: 'uploaded_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  uploadedAt: Date = new Date();

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date = new Date();
}
