/**
 * ACL Test Entities
 *
 * These entities are designed to test all aspects of the ACL permissions module.
 *
 * Entity Overview:
 * - UserProfile: One-to-One with Users, field-level permissions
 * - Category: Self-referencing hierarchical structure
 * - Post: Core entity with status, ownership, relationships
 * - Comment: Nested ownership, moderation
 * - Tag: Many-to-Many with Post, creator ownership
 * - Article: Complex scenarios (multiple owners, nested objects, time-based)
 * - Document: File upload scenarios, shared access
 *
 * Coverage:
 * ✅ Ownership patterns
 * ✅ Role-based access
 * ✅ Field-level permissions (Entity:select)
 * ✅ Relationship permissions (Entity:include)
 * ✅ Status-based access
 * ✅ Hierarchical permissions
 * ✅ Array conditions
 * ✅ Nested object conditions
 * ✅ Time-based access
 * ✅ @context templates
 * ✅ @input templates
 */

export * from './user.entity';
export * from './user-profile.entity';
export * from './category.entity';
export * from './post.entity';
export * from './comment.entity';
export * from './tag.entity';
export * from './article.entity';
export * from './document.entity';
export * from './context.entity';
