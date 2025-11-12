<p align='center'>
  <a href="https://www.npmjs.com/package/acl-json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/v/acl-json-api-nestjs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/acl-json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/l/acl-json-api-nestjs.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/acl-json-api-nestjs" target="_blank"><img src="https://img.shields.io/npm/dm/acl-json-api-nestjs.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/acl-json-api-nestjs.json" alt="Coverage Badge" />
</p>

# acl-json-api-nestjs


Type-safe, flexible Access Control List (ACL) module for NestJS with CASL integration and template-based rule materialization.

**⚠️ Module Purpose:**

This module was specifically designed to integrate with `@klerick/json-api-nestjs`, providing:
- ✅ **Automatic ACL setup** via `wrapperJsonApiController` hook
- ✅ **Transparent ORM-level filtering** for JSON:API operations

**Can be used standalone** with any NestJS application:
- ⚙️ Manual setup required: apply `@AclController` decorator and `AclGuard` to controllers
- ✅ All features available: template materialization, field-level permissions, context/input interpolation

## Features

- **Two-stage materialization** - Static rules (context) vs dynamic rules (@input)
- **Guard-based authorization** - Fail-fast approach with AclGuard
- **CLS integration** - ExtendableAbility available in pipes/guards/services via contextStore
- **Template interpolation** - Use `${currentUserId}` (context) and `${@input.data}` (@input) in rules
- **Lazy evaluation** - Rules with @input are materialized only when needed

## Installation

```bash
npm install @klerick/nestjs-acl-permissions @casl/ability
```

**Recommended:** Install `nestjs-cls` for context store (provides AsyncLocalStorage-based storage):
```bash
npm install nestjs-cls
```

## Quick Start

### 1. Define your RulesLoader

```typescript
import { Injectable } from '@nestjs/common';
import { AclRulesLoader, AclRule } from '@klerick/nestjs-acl-permissions';

@Injectable()
export class MyRulesLoaderService implements AclRulesLoader {
  async loadRules<E>(entity: any, action: string): Promise<AclRule<E>[]> {
    return [
      {
        action: 'getAll',
        subject: 'Post',
        fields: ['title', 'content'], // Only these fields allowed
      },
      {
        action: 'patchOne',
        subject: 'Post',
        conditions: { authorId: '${currentUserId}' }, // From context
      },
    ];
  }

  async getContext(): Promise<Record<string, unknown>> {
    // Return session data (e.g., current user)
    return {
      currentUserId: 123,
      role: 'user',
    };
  }

  async getHelpers(): Promise<Record<string, (...args: unknown[]) => unknown>> {
    return {}; // Optional helper functions
  }
}
```

### 2. Register the module with Context Store

**⚠️ IMPORTANT:** ACL module requires a `contextStore` that implements `AclContextStore` interface and uses `AsyncLocalStorage` internally.

**📦 Recommended:** Use `nestjs-cls` - a ready-made solution:

```bash
npm install nestjs-cls
```

```typescript
import { Module } from '@nestjs/common';
import { AclPermissionsModule } from '@klerick/nestjs-acl-permissions';
import { ClsModule, ClsService } from 'nestjs-cls';

@Module({
  imports: [
    // ClsModule - recommended context store implementation
    // Uses AsyncLocalStorage for request-scoped data (no REQUEST scope needed!)
    ClsModule.forRoot({
      global: true, // Make ClsService available everywhere
      middleware: {
        mount: true, // Mount middleware to initialize CLS context per-request
      },
    }),

    // ACL module
    AclPermissionsModule.forRoot({
      rulesLoader: MyRulesLoaderService,
      contextStore: ClsService, // Pass any service that implements AclContextStore
      onNoRules: 'deny', // deny | allow (default: 'deny')
      defaultRules: [], // Optional fallback rules
    }),
  ],
})
export class AppModule {}
```

**Why use a Context Store with AsyncLocalStorage?**

- `AsyncLocalStorage` provides request-scoped data **without using `Scope.REQUEST`**
- Your services remain **SINGLETONS** (created once) and still access request-specific ACL ability
- No performance penalty from recreating providers on every request

**Custom Implementation (if needed):**

You can implement your own `contextStore`:

```typescript
interface AclContextStore {
  get<T>(key: symbol | string): T | undefined;
  set<T>(key: symbol | string, value: T): void;
}

// Your custom implementation using AsyncLocalStorage
@Injectable()
export class MyContextStore implements AclContextStore {
  private storage = new AsyncLocalStorage<Map<symbol | string, any>>();

  get<T>(key: symbol | string): T | undefined {
    return this.storage.getStore()?.get(key);
  }

  set<T>(key: symbol | string, value: T): void {
    this.storage.getStore()?.set(key, value);
  }

  // Middleware to initialize storage per-request
  middleware(req, res, next) {
    this.storage.run(new Map(), () => next());
  }
}
```

### 3. Apply ACL to controllers

**Option A: Automatic (with `@klerick/json-api-nestjs`)**

If you're using `@klerick/json-api-nestjs`, ACL is applied automatically via hook:

```typescript
import { Module } from '@nestjs/common';
import { JsonApiModule } from '@klerick/json-api-nestjs';
import { MicroOrmJsonApiModule } from '@klerick/json-api-nestjs-microorm';
import { wrapperJsonApiController } from '@klerick/nestjs-acl-permissions';

@Module({
  imports: [
    JsonApiModule.forRoot(MicroOrmJsonApiModule, {
      entities: [User, Post, Comment],
      hooks: {
        afterCreateController: wrapperJsonApiController,  // 🔥 Automatic ACL
      },
    }),
  ],
})
export class ResourcesModule {}
```

The hook automatically applies `@AclController` and `@UseGuards(AclGuard)` to all JSON:API controllers that don't have the decorator yet.

**Option B: Override per controller (with `@klerick/json-api-nestjs`)**

If the hook is enabled, you can still override ACL settings for specific controllers by applying `@AclController` manually. **The hook will detect the existing decorator and skip it**, using your custom settings instead:

```typescript
import { Controller } from '@nestjs/common';
import { AclController } from '@klerick/nestjs-acl-permissions';
import { JsonBaseController } from '@klerick/json-api-nestjs';

@AclController({
  subject: Post,
  methods: {
    getAll: true,      // Enable ACL with global options
    getOne: true,      // Enable ACL with global options
    patchOne: true,    // Enable ACL with global options
    deleteOne: false,  // Disable ACL for this method
  },
})
export class PostsController extends JsonBaseController<Post> {}
```

**Per-method options override:**

You can override `onNoRules` and `defaultRules` for specific methods:

```typescript
@AclController({
  subject: Post,
  methods: {
    getAll: true,  // Uses global onNoRules and defaultRules

    getOne: false, // ACL completely disabled

    patchOne: {    // Override options for this method only
      onNoRules: 'allow',  // Allow if no rules (ignores global 'deny')
      defaultRules: [      // Fallback rules for this method
        {
          action: 'patchOne',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' },
        },
      ],
    },

    deleteOne: {   // Strict mode for this method
      onNoRules: 'deny',
      defaultRules: [],  // No fallback
    },
  },
})
export class PostsController extends JsonBaseController<Post> {}
```

**Options priority:**
```
Method-specific options > Global module options > Default ('deny')
```

**Option C: Standalone (without `@klerick/json-api-nestjs`)**

You can use this module with regular NestJS controllers. Just apply `@AclController` decorator and `@UseGuards(AclGuard)`:

```typescript
import { Controller, Get, Post, Patch, Delete, UseGuards } from '@nestjs/common';
import { AclController, AclGuard } from '@klerick/nestjs-acl-permissions';

@AclController({
  subject: 'Post',  // String subject
  methods: {
    findAll: true,   // Your method names
    findOne: true,
    update: true,
    remove: false,
  },
})
@Controller('posts')
export class PostsController {
  @Get()
  findAll() {
    // Your logic...
  }

  @Get(':id')
  findOne() {
    // Your logic...
  }

  @Patch(':id')
  update() {
    // Your logic...
  }

  @Delete(':id')
  remove() {
    // Your logic...
  }
}
```

**Note:** When using standalone mode, you'll need to manually handle ACL checks in your service layer using `ExtendAbility.updateWithInput()` for `@input` template materialization.

### 4. Use ExtendAbility in services (optional)

**⚠️ DO NOT use `Scope.REQUEST`!** The `ExtendAbility` provider is a **SINGLETON Proxy** that automatically retrieves the ability for the current request from contextStore.

**For `@klerick/json-api-nestjs`:** ACL checks are handled automatically at the ORM level. You don't need to inject `ExtendAbility` in your services unless you have custom logic.

**For standalone mode:** You need to manually inject and use `ExtendAbility`:

```typescript
import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ExtendAbility } from '@klerick/nestjs-acl-permissions';
import { subject } from '@casl/ability';

@Injectable()
export class PostsService {
  // Inject ExtendAbility like any other dependency
  // This is a SINGLETON proxy - your service stays SINGLETON too!
  @Inject(ExtendAbility)
  private readonly ability!: ExtendAbility;

  async updatePost(id: number, data: UpdatePostDto) {
    const post = await this.loadPost(id);

    // Update ability with entity data for @input templates
    this.ability.updateWithInput(post);

    // Check access with materialized rules (context + @input)
    if (!this.ability.can('patchOne', subject('Post', post))) {
      throw new ForbiddenException('Cannot update this post');
    }

    return this.savePost(post, data);
  }

  async deletePost(id: number) {
    const post = await this.loadPost(id);

    // Update ability with entity data
    this.ability.updateWithInput(post);

    // Check deletion access
    if (!this.ability.can('deleteOne', subject('Post', post))) {
      throw new ForbiddenException('Cannot delete this post');
    }

    return this.removePost(post);
  }
}
```

**How it works:**

1. `ExtendAbility` is a **Proxy** (not a real instance)
2. When you call `this.ability.can()`, the proxy retrieves the actual ability from contextStore
3. contextStore (via `AsyncLocalStorage`) automatically returns data for the **current request**
4. No `Scope.REQUEST` needed - your service is still a **SINGLETON**
5. `updateWithInput()` materializes rules with `@input` data from the entity

**Two-stage materialization:**
- **Guard level**: Rules materialized with `context` only (fast check)
- **Service level**: Call `updateWithInput()` to materialize rules with `@input` data (full check)

---

## Template Interpolation System

The ACL module uses a powerful template interpolation system that allows you to embed dynamic values in your rules using `${...}` syntax. This section explains how it works in detail.

### Template Syntax

Templates use JavaScript-like expressions inside `${}`:

```typescript
// Rule with templates:
{
  action: 'getAll',
  subject: 'Post',
  conditions: {
    authorId: '${currentUserId}',           // Context variable
    status: '${@input.status}',             // Input variable
    createdAt: { $gt: '${yesterday()}' }    // Helper function
  }
}

// After materialization:
{
  action: 'getAll',
  subject: 'Post',
  conditions: {
    authorId: 123,              // Value from context
    status: 'published',        // Value from input
    createdAt: { $gt: '2025-01-10T00:00:00.000Z' }  // Result of helper
  }
}
```

**Important:** Templates are **strings** that contain `${...}` expressions. The interpolation happens during rule materialization.

### Three Types of Variables

#### 1. Context Variables - `${varName}`

**Available:** Always (materialized at Guard level)
**Source:** `AclRulesLoader.getContext()`
**Use case:** Session data, current user info, global settings

```typescript
// In your RulesLoader:
async getContext(): Promise<Record<string, unknown>> {
  return {
    currentUserId: 123,
    currentUser: {
      id: 123,
      role: 'moderator',
      departmentId: 5
    },
    tenantId: 'acme-corp'
  };
}

// In rules:
{
  conditions: {
    authorId: '${currentUserId}',                    // Simple variable
    'author.role': '${currentUser.role}',            // Nested access
    departmentId: '${currentUser.departmentId}',     // Nested property
    tenant: '${tenantId}'                            // Top-level variable
  }
}

// After materialization:
{
  conditions: {
    authorId: 123,
    'author.role': 'moderator',
    departmentId: 5,
    tenant: 'acme-corp'
  }
}
```

**Nested access:**

```typescript
// Context:
{
  currentUser: {
    profile: {
      settings: {
        theme: 'dark'
      }
    }
  }
}

// Rule:
{ conditions: { theme: '${currentUser.profile.settings.theme}' } }
// → { conditions: { theme: 'dark' } }
```

#### 2. Input Variables - `${@input.field}`

**Available:** Only after `updateWithInput()` (Service level)
**Source:** Entity data passed to `updateWithInput(entity)`
**Use case:** Entity-specific conditions, field-level validation

```typescript
// In service (after fetching entity):
const post = await this.loadPost(id);  // { id: 5, authorId: 123, status: 'draft' }
this.ability.updateWithInput(post);    // Materialize with entity data

// Rules with @input:
{
  conditions: {
    authorId: '${@input.authorId}',      // Field from entity
    status: '${@input.status}',          // Another field
    'tags': { $size: '${@input.tags.length}' }  // Array property
  }
}

// After updateWithInput:
{
  conditions: {
    authorId: 123,           // From post.authorId
    status: 'draft',         // From post.status
    'tags': { $size: 3 }     // From post.tags.length
  }
}
```

**Array operations with `.map()` syntax:**

```typescript
// Entity:
{
  id: 5,
  tags: [
    { id: 1, name: 'tech' },
    { id: 2, name: 'news' },
    { id: 3, name: 'tutorial' }
  ]
}

// Rule - extract all IDs:
{
  conditions: {
    'tags.id': { $in: '${@input.tags.map(i => i.id)}' }  // Extract all ids
  }
}

// After materialization:
{
  conditions: {
    'tags.id': { $in: [1, 2, 3] }  // Array of extracted values
  }
}
```

**Common patterns:**

```typescript
// Check if array contains value
{ coAuthorIds: { $in: ['${currentUserId}'] } }

// Extract IDs from relationship array
{ 'posts.id': { $in: '${@input.posts.map(i => i.id)}' } }

// Array size validation
{ tags: { $size: '${@input.tags.length}' } }

// All items must match condition
{ comments: { $all: { authorId: '${currentUserId}' } } }
```

#### 3. `__current` Variables - `${@input.__current.field}`

**Available:** Only in `patchOne` and `patchRelationship`
**Source:** OLD entity values (before update)
**Use case:** Compare old vs new values, validate transitions

```typescript
// patchOne scenario:
// OLD entity (from DB): { id: 5, status: 'draft', coAuthorIds: [1, 2, 3] }
// NEW data (from request): { status: 'review', coAuthorIds: [2, 3, 4] }

// Entity passed to updateWithInput:
{
  id: 5,
  status: 'review',           // NEW value at root
  coAuthorIds: [2, 3, 4],     // NEW value at root
  __current: {
    id: 5,
    status: 'draft',          // OLD value in __current
    coAuthorIds: [1, 2, 3]    // OLD value in __current
  }
}

// Rules with __current:
{
  conditions: {
    // OLD status must be draft
    '__current.status': 'draft',

    // NEW status must be review or published
    'status': { $in: ['review', 'published'] },

    // NEW array must include all OLD items (can only add, not remove)
    'coAuthorIds': { $all: '${@input.__current.coAuthorIds}' }
  }
}

// After materialization:
{
  conditions: {
    '__current.status': 'draft',
    'status': { $in: ['review', 'published'] },
    'coAuthorIds': { $all: [1, 2, 3] }  // Must contain old IDs
  }
}
```

**Use cases:**

1. **State transitions:** "Can change status from draft to review, but not to published"
2. **Add-only updates:** "Can add items to array but cannot remove existing ones"
3. **Conditional removal:** "Can remove only yourself from coAuthors"
4. **Value increase:** "Can increase price but not decrease it"

### Helper Functions - `${helperName(arg1, arg2)}`

**Available:** Always
**Source:** `AclRulesLoader.getHelpers()`
**Use case:** Complex calculations, reusable logic

```typescript
// In your RulesLoader:
async getHelpers(): Promise<Record<string, (...args: unknown[]) => unknown>> {
  return {
    // Helper: Remove userId from array
    removeMyselfOnly: (oldArray: number[], userId: number): number[] => {
      return oldArray.filter(id => id !== userId);
    },

    // Helper: Check if date is in past
    isInPast: (dateStr: string): boolean => {
      return new Date(dateStr) < new Date();
    },

    // Helper: Calculate yesterday
    yesterday: (): string => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.toISOString();
    },

    // Helper: Extract unique IDs
    uniqueIds: (items: Array<{ id: number }>): number[] => {
      return [...new Set(items.map(i => i.id))];
    }
  };
}

// In rules:
{
  action: 'patchOne',
  subject: 'Article',
  conditions: {
    // CoAuthor can remove only themselves
    'coAuthorIds': {
      $all: '${removeMyselfOnly(@input.__current.coAuthorIds, currentUser.id)}',
      $size: '${@input.__current.coAuthorIds.length - 1}'
    },

    // Must be created in the past
    '__current.createdAt': { $lt: '${yesterday()}' },

    // Check if already published
    'isPublished': '${isInPast(@input.publishedAt)}'
  }
}
```

**Helper function arguments:**

You can pass three types of values to helpers:
1. **Context variables:** `${helper(currentUserId)}`
2. **Input variables:** `${helper(@input.tags)}`
3. **Literals:** `${helper('draft', 5, true)}`

**Advanced example:**

```typescript
// Helper:
getHelpers() {
  return {
    // Check if user is removing only themselves from array
    isSelfRemovalOnly: (
      oldArray: number[],
      newArray: number[],
      userId: number
    ): boolean => {
      const removed = oldArray.filter(id => !newArray.includes(id));
      return removed.length === 1 && removed[0] === userId;
    }
  };
}

// Rule:
{
  conditions: {
    // Custom validation using helper
    'valid': '${isSelfRemovalOnly(@input.__current.coAuthorIds, @input.coAuthorIds, currentUser.id)}'
  }
}
```

### Two-Stage Materialization

Rules are materialized in **two stages** for performance:

#### Stage 1: Guard Level (Context Only)

**When:** Request enters AclGuard
**Available variables:** Context variables + Helper functions
**Not available:** `@input` variables

```typescript
// Original rule:
{
  action: 'patchOne',
  subject: 'Post',
  conditions: {
    departmentId: '${currentUser.departmentId}',  // ✅ Available (context)
    authorId: '${@input.authorId}'                 // ❌ Not available yet
  }
}

// After Stage 1 (Guard):
{
  conditions: {
    departmentId: 5,                    // ✅ Materialized
    authorId: '${@input.authorId}'      // ❌ Still template
  }
}
```

**Guard checks:** `can('patchOne', 'Post')`
- If rule has only context variables → fully materialized → can evaluate
- If rule has `@input` variables → partially materialized → deferred until Stage 2

#### Stage 2: Service Level (Context + Input)

**When:** `updateWithInput(entity)` is called
**Available variables:** All (Context + Input + Helpers)

```typescript
// After Stage 2 (updateWithInput):
{
  conditions: {
    departmentId: 5,       // ✅ From Stage 1
    authorId: 123          // ✅ Materialized at Stage 2
  }
}
```

**Service checks:** `can('patchOne', subject('Post', post))`
- All templates materialized → full validation

**Flow example:**

```typescript
// 1. Request enters Guard
// → Rules materialized with context (Stage 1)
// → Check: can('patchOne', 'Post') → allowed

// 2. Controller calls service
const post = await this.ormService.getOne(id);  // Fetch entity

// 3. Service updates ability
this.ability.updateWithInput(post);  // Stage 2: materialize with entity data

// 4. Service checks with full data
if (!this.ability.can('patchOne', subject('Post', post))) {
  throw new ForbiddenException();
}
```

### Strict Mode (Error Handling)

**Default:** `strictInterpolation: true` (enabled)

When a template references an **undefined variable**, the behavior depends on strict mode:

#### Strict Mode Enabled (default)

**Throws error immediately:**

```typescript
// Configuration:
AclPermissionsModule.forRoot({
  rulesLoader: MyRulesLoader,
  contextStore: ClsService,
  strictInterpolation: true,  // Default
})

// Rule with typo:
{
  conditions: {
    authorId: '${@input.athourId}'  // Typo: 'athourId' instead of 'authorId'
  }
}

// Error when updateWithInput is called:
// ReferenceError: Property 'input.athourId' is not defined in strict mode
// Available variables: input, currentUserId, currentUser, ...
```

**Benefits:**
- ✅ Catch typos and missing fields early
- ✅ Fail-fast approach
- ✅ Clear error messages

**Recommended for:** Production environments

#### Strict Mode Disabled

**Logs warning, treats undefined as `null`:**

```typescript
// Configuration:
AclPermissionsModule.forRoot({
  rulesLoader: MyRulesLoader,
  contextStore: ClsService,
  strictInterpolation: false,  // Disable strict mode
})

// Rule with undefined variable:
{
  conditions: {
    authorId: '${@input.athourId}'  // Typo
  }
}

// After materialization:
{
  conditions: {
    authorId: null  // Undefined → null
  }
}

// Warning in logs:
// [WARN] Failed to materialize rules: Cannot read property 'athourId' of undefined.
// Available variables: input, currentUserId, currentUser, ...
```

**Use case:** Development, debugging, or when you want lenient behavior

### Nested Object Access

Access nested properties using dot notation:

```typescript
// Context:
{
  currentUser: {
    profile: {
      department: {
        id: 5,
        name: 'Engineering',
        location: {
          city: 'New York',
          country: 'USA'
        }
      }
    },
    permissions: ['read', 'write']
  }
}

// Rules with nested access:
{
  conditions: {
    // Simple nested
    'departmentId': '${currentUser.profile.department.id}',

    // Deep nested
    'location.city': '${currentUser.profile.department.location.city}',

    // Array element
    'permission': '${currentUser.permissions[0]}',  // 'read'

    // Combining nested + array extraction
    'user.permissions': { $in: '${currentUser.permissions}' }
  }
}

// After materialization:
{
  conditions: {
    'departmentId': 5,
    'location.city': 'New York',
    'permission': 'read',
    'user.permissions': { $in: ['read', 'write'] }
  }
}
```

**With `@input`:**

```typescript
// Entity:
{
  id: 5,
  author: {
    id: 123,
    profile: {
      department: {
        id: 10,
        name: 'Sales'
      }
    }
  },
  tags: [
    { id: 1, category: { name: 'Tech' } },
    { id: 2, category: { name: 'News' } }
  ]
}

// Rules:
{
  conditions: {
    // Nested object
    'authorDepartment': '${@input.author.profile.department.id}',

    // Extract from nested arrays
    'categories': { $in: '${@input.tags.map(i => i.category.name)}' }
  }
}

// After materialization:
{
  conditions: {
    'authorDepartment': 10,
    'categories': { $in: ['Tech', 'News'] }
  }
}
```

### Array Extraction with `.map()`

Extract properties from all items in an array using `.map()` syntax:

```typescript
// Entity:
{
  posts: [
    { id: 1, title: 'Post A', authorId: 123 },
    { id: 2, title: 'Post B', authorId: 123 },
    { id: 3, title: 'Post C', authorId: 456 }
  ]
}

// Extract all IDs:
'${@input.posts.map(i => i.id)}'           // → [1, 2, 3]

// Extract all authorIds:
'${@input.posts.map(i => i.authorId)}'     // → [123, 123, 456]

// Extract all titles:
'${@input.posts.map(i => i.title)}'        // → ['Post A', 'Post B', 'Post C']

// Use in conditions:
{
  conditions: {
    // Check if specific post ID exists
    'posts.id': { $in: '${@input.posts.map(i => i.id)}' },

    // All posts must be by current user
    'posts': {
      $all: { authorId: '${currentUserId}' }
    }
  }
}
```

**Nested extraction:**

```typescript
// Entity with nested arrays:
{
  posts: [
    {
      id: 1,
      tags: [
        { id: 10, name: 'tech' },
        { id: 20, name: 'news' }
      ]
    },
    {
      id: 2,
      tags: [
        { id: 30, name: 'tutorial' }
      ]
    }
  ]
}

// Extract all tag IDs from all posts:
// ❌ This doesn't work: '${@input.posts.map(p => p.tags.map(t => t.id))}'  // Returns nested arrays
// ✅ Use helper function with flatMap instead:

// Helper:
getHelpers() {
  return {
    flattenTagIds: (posts: Array<{ tags: Array<{ id: number }> }>): number[] => {
      return posts.flatMap(p => p.tags.map(t => t.id));
    }
  };
}

// Rule:
{ conditions: { 'tagIds': { $in: '${flattenTagIds(@input.posts)}' } } }
// → { 'tagIds': { $in: [10, 20, 30] } }
```

### Type Handling

The interpolation system handles different types correctly:

```typescript
// String:
'${@input.name}'              // → "John Doe"

// Number:
'${@input.age}'               // → 25

// Boolean:
'${@input.isActive}'          // → true

// null:
'${@input.deletedAt}'         // → null

// undefined (strict mode off):
'${@input.missing}'           // → null

// Array:
'${@input.tags}'              // → [1, 2, 3]

// Object:
'${@input.metadata}'          // → { "key": "value" }

// Date:
'${@input.createdAt}'         // → "2025-01-11T00:00:00.000Z" (ISO string)

// Nested:
'${@input.user.profile.bio}'  // → "Software engineer"

// Array of objects:
'${@input.posts.map(i => i.id)}'       // → [1, 2, 3]
```

### Edge Cases and Limitations

#### 1. **Escaping `${` in string values**

If your data contains literal `${`, it won't be treated as a template:

```typescript
// Context with literal ${}:
{
  message: 'Use ${variable} syntax'  // This is data, not a template
}

// Rule:
{ conditions: { msg: '${message}' } }

// After materialization:
{ conditions: { msg: 'Use ${variable} syntax' } }  // ✅ Works fine
```

Templates are only evaluated in **rule definitions**, not in data values.

#### 2. **Circular references**

Circular references in context/input will cause errors:

```typescript
// ❌ Bad:
const user = { id: 123 };
user.self = user;  // Circular reference

this.ability.updateWithInput(user);  // Error: Converting circular structure to JSON
```

**Solution:** Don't pass circular structures to `updateWithInput()`

#### 3. **Nested `.map()` returns nested arrays**

```typescript
// ✅ Works - single level:
'${@input.posts.map(i => i.id)}'                    // Extract IDs from posts → [1, 2, 3]

// ❌ Doesn't work - nested arrays:
'${@input.posts.map(p => p.tags.map(t => t.id))}'   // Returns [[1,2], [3,4]] instead of [1,2,3,4]

// ✅ Use helper function with flatMap:
getHelpers() {
  return {
    extractNestedIds: (posts) => posts.flatMap(p => p.tags.map(t => t.id))
  };
}
{ conditions: { ids: '${extractNestedIds(@input.posts)}' } }
```

#### 4. **Undefined vs null**

- `undefined` properties are converted to `null` in JSON (JSON spec)
- In strict mode, accessing undefined property throws error **before** conversion

```typescript
// Entity:
{ id: 5, name: 'John' }  // No 'age' property

// Rule:
{ conditions: { age: '${@input.age}' } }

// Strict mode ON: ReferenceError (property not defined)
// Strict mode OFF: { age: null }
```

#### 5. **Helper functions must be synchronous**

```typescript
// ❌ Bad: Async helper
getHelpers() {
  return {
    fetchUser: async (id) => {  // ❌ Async not supported
      return await db.getUser(id);
    }
  };
}

// ✅ Good: Sync helper
getHelpers() {
  return {
    calculateAge: (birthDate: string): number => {
      return new Date().getFullYear() - new Date(birthDate).getFullYear();
    }
  };
}
```

**Why?** Rule materialization happens synchronously for performance.

#### 6. **Template expressions must be valid JavaScript**

```typescript
// ✅ Valid:
'${@input.age > 18}'                          // Boolean expression
'${@input.tags.length}'                       // Property access
'${helper(@input.value, "test", 123)}'        // Function call

// ❌ Invalid:
'${@input.age > 18 ? "adult" : "minor"}'      // Ternary not supported (use helper)
'${const x = 5; return x * 2;}'               // Statements not supported
```

### Common Patterns

#### Pattern 1: Owner-only access

```typescript
{
  action: 'patchOne',
  subject: 'Post',
  conditions: {
    authorId: '${@input.authorId}',        // Entity must belong to user
    'author.id': '${currentUserId}'        // Alternative: nested check
  }
}
```

#### Pattern 2: Role-based with field restrictions

```typescript
// Context:
{ currentUser: { role: 'moderator' } }

// Rules:
[
  {
    action: 'getAll',
    subject: 'User',
    conditions: { role: 'user' },  // Can see only regular users
  },
  {
    action: 'getAll',
    subject: 'User',
    conditions: { id: '${currentUser.id}' },  // Can see own profile
    fields: ['*']  // All fields for own profile
  }
]
```

#### Pattern 3: State machine transitions

```typescript
{
  action: 'patchOne',
  subject: 'Order',
  conditions: {
    '__current.status': 'pending',         // OLD status
    'status': { $in: ['processing', 'cancelled'] }  // NEW status (allowed transitions)
  }
}
```

#### Pattern 4: Array manipulation with helpers

```typescript
// Helper:
getHelpers() {
  return {
    canRemoveOnly: (oldArray: number[], newArray: number[], userId: number): boolean => {
      const removed = oldArray.filter(id => !newArray.includes(id));
      const added = newArray.filter(id => !oldArray.includes(id));
      return added.length === 0 && removed.length === 1 && removed[0] === userId;
    }
  };
}

// Rule: CoAuthor can only remove themselves
{
  conditions: {
    '__current.coAuthorIds': { $in: ['${currentUserId}'] },  // Was coauthor
    'valid': '${canRemoveOnly(@input.__current.coAuthorIds, @input.coAuthorIds, currentUserId)}'
  }
}
```

---

## API Reference

### ExtendAbility

The `ExtendAbility` class extends CASL's `PureAbility` and provides additional features for template materialization and query extraction.

**Injection:**
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ExtendAbility } from '@klerick/nestjs-acl-permissions';

@Injectable()
export class MyService {
  @Inject(ExtendAbility)
  private readonly ability!: ExtendAbility;
}
```

#### Methods

##### `updateWithInput(input: AclInputData): void`

Re-materializes ALL rules with `@input` data. This is the **second stage** of materialization.

```typescript
// First stage (in Guard): rules materialized with context only
// ability.can('patchOne', 'Post') // Uses ${currentUserId}

// Second stage (in Service): re-materialize with @input
this.ability.updateWithInput(entity);
// Now rules with ${@input.userId} are also materialized
```

**Parameters:**
- `input: AclInputData` - Any object with data for `${@input.*}` templates

**Example:**
```typescript
const post = await this.getPost(id);
this.ability.updateWithInput(post); // Materialize with post data

// Now you can use rules like:
// { conditions: { authorId: '${@input.authorId}' } }
```

---

##### `can(action: string, subject: any, field?: string): boolean`

Check if action is allowed on subject. This is the native CASL method.

**Parameters:**
- `action: string` - Action name (e.g., 'getAll', 'patchOne')
- `subject: any` - Subject to check (entity class, instance, or string)
- `field?: string` - Optional field name for field-level checks

**Returns:** `boolean` - `true` if allowed, `false` otherwise

**Examples:**
```typescript
import { subject } from '@casl/ability';

// Action-level check
if (this.ability.can('getAll', 'Post')) {
  // Allowed to get all posts
}

// Entity-level check (with instance)
const post = await this.getPost(id);
if (this.ability.can('patchOne', subject('Post', post))) {
  // Allowed to patch THIS specific post
}

// Field-level check
if (this.ability.can('getAll', 'Post', 'title')) {
  // Allowed to read 'title' field
}
```

**⚠️ Important:**
- For entity instances, use `subject('EntityName', instance)` helper from CASL
- Field-level checks require `fields` in rules
- Always call `updateWithInput()` before checking if you need `@input` data

---

##### `hasConditions: boolean`

Getter that returns `true` if any rule contains `conditions`.

**Use case:** Optimization - skip query modifications if no conditions exist.

```typescript
if (this.ability.hasConditions) {
  // Fetch data with ACL query filtering
  const aclQuery = this.ability.getQueryObject();
  // ...
} else {
  // Fast path - fetch without ACL filtering
}
```

---

##### `hasFields: boolean`

Getter that returns `true` if any rule contains `fields`.

**Use case:** Optimization - skip field filtering if no field restrictions exist.

```typescript
if (this.ability.hasFields) {
  // Need to filter fields
} else {
  // Fast path - no field filtering needed
}
```

---

##### `hasConditionsAndFields(): boolean`

Returns `true` if any rule has BOTH `conditions` AND `fields`.

**Use case:** Determine filtering strategy.

```typescript
if (this.ability.hasConditionsAndFields()) {
  // Need both query filtering AND field filtering
}
```

---

##### `getQueryObject<E, IdKey>(): { fields?, include?, rulesForQuery? }`

Extracts query data from ACL conditions. Used internally by ORM Proxy.

**Returns:**
```typescript
{
  fields?: {
    target?: string[];        // Entity fields to fetch
    [relation: string]?: string[];  // Relationship fields to fetch
  };
  include?: string[];         // Relations to include (JOIN)
  rulesForQuery?: Record<string, unknown>;  // Knex-compatible query object
}
```

**About `rulesForQuery`:**
- Returns a **Knex-compatible query object** (not raw MongoDB)
- Can be used directly with MikroORM's query builder
- **For `@klerick/json-api-nestjs`**: Handled automatically by ORM Proxy, you don't need to use it
- **For standalone**: Can be used to build filtered queries manually

**Example:**
```typescript
const aclData = this.ability.getQueryObject();

// Rules: [{ conditions: { authorId: 123, 'profile.isPublic': true } }]
// Returns:
// {
//   fields: { target: ['authorId'], profile: ['isPublic'] },
//   include: ['profile'],
//   rulesForQuery: { authorId: 123, profile: { isPublic: true } }
// }

// Usage with MikroORM (standalone mode):
const qb = em.createQueryBuilder(Post);
if (aclData.rulesForQuery) {
  qb.where(aclData.rulesForQuery);
}
```

**Use case:** Used by ORM Proxy to automatically filter queries with ACL conditions. If you're using `@klerick/json-api-nestjs`, this is handled transparently - you typically don't need to call this manually.

---

##### `get action(): string`

Returns the current action name.

```typescript
console.log(this.ability.action); // 'getAll'
```

---

##### `get subject(): string`

Returns the current subject name.

```typescript
console.log(this.ability.subject); // 'Post'
```

---

##### `get rules(): RawRuleFrom[]`

Returns the original rules array (before materialization).

**Use case:** Debugging, logging, or custom logic.

```typescript
console.log(this.ability.rules);
// [
//   { action: 'getAll', subject: 'Post', conditions: { authorId: '${currentUserId}' } }
// ]
```

---

##### `get context(): Record<string, unknown>`

Returns the context object used for materialization.

```typescript
console.log(this.ability.context);
// { currentUserId: 123, role: 'admin' }
```

---

##### `get helpers(): Record<string, Function>`

Returns the helper functions object.

```typescript
console.log(this.ability.helpers);
// { extractIds: [Function], isSameDepartment: [Function] }
```

---

### CASL Methods

Since `ExtendAbility` extends `PureAbility`, you also have access to all CASL methods:

- `cannot(action, subject, field?)` - Inverse of `can()`
- `relevantRuleFor(action, subject, field?)` - Get relevant rule
- `rulesFor(action, subject)` - Get all rules for action/subject

See [CASL documentation](https://casl.js.org/v6/en/api/casl-ability) for full API.

---

## Integration with @klerick/json-api-nestjs

### Automatic Protection via Hook

The ACL module integrates seamlessly with `@klerick/json-api-nestjs` via the hook system:

```typescript
import { Module } from '@nestjs/common';
import { JsonApiModule } from '@klerick/json-api-nestjs';
import { MicroOrmJsonApiModule } from '@klerick/json-api-nestjs-microorm';
import { AclPermissionsModule, wrapperJsonApiController } from '@klerick/nestjs-acl-permissions';
import { ClsModule, ClsService } from 'nestjs-cls';

@Module({
  imports: [
    // CLS for storing ExtendAbility
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),

    // ACL module
    AclPermissionsModule.forRoot({
      rulesLoader: MyRulesLoaderService,
      contextStore: ClsService,
      onNoRules: 'deny',  // Default behavior
    }),

    // JSON API with ACL hook
    JsonApiModule.forRoot(MicroOrmJsonApiModule, {
      entities: [User, Post, Comment],
      hooks: {
        afterCreateController: wrapperJsonApiController,  // 🔥 ACL integration
      },
    }),
  ],
})
export class ResourcesModule {}
```

**What happens:**

1. JSON API creates controllers for each entity (`UserJsonApiController`, `PostJsonApiController`, etc.)
2. `wrapperJsonApiController` hook automatically:
   - Applies `@AclController` metadata with entity as subject
   - Applies `@UseGuards(AclGuard)` to protect all methods
   - Wraps ORM service methods with ACL filtering proxies
3. All JSON:API endpoints are now ACL-protected automatically with transparent ORM-level filtering

### ORM-Level Filtering

**Key Feature:** ACL filtering happens at the ORM level, not in pipes or interceptors.

```typescript
// When user calls: GET /posts
//
// 1. AclGuard checks: can('getAll', 'Post')
// 2. If allowed, ExtendAbility is stored in CLS
// 3. Controller calls ormService.getAll(query)
// 4. ORM Proxy intercepts the call:
//    - Extracts ACL conditions via ability.getQueryObject()
//    - Merges user query with ACL query (fields, includes, conditions)
//    - Fetches data with ACL filtering applied
//    - Filters fields per-item if needed (field-level permissions)
//    - Returns filtered result
```

**Benefits:**

- ✅ **Transparent** - Controllers don't need to know about ACL
- ✅ **Performant** - Database-level filtering (WHERE clauses)
- ✅ **Secure** - Field-level filtering after fetch if needed
- ✅ **Complete** - Handles all JSON:API operations (CRUD + relationships)

### Important: onNoRules Behavior

**⚠️ Default Behavior:** If `onNoRules: 'deny'` (default) and no rules are found, ACL will **block access with 403 Forbidden**.

```typescript
// Configuration:
AclPermissionsModule.forRoot({
  rulesLoader: MyRulesLoader,
  contextStore: ClsService,
  onNoRules: 'deny',       // Default: deny if no rules
  defaultRules: [],        // Default: no fallback rules
})

// If MyRulesLoader returns empty array:
async loadRules(subject, action) {
  return [];  // No rules!
}

// Result: 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow access",
//     "path": []
//   }]
// }
```

**Override per controller/method:**

```typescript
@AclController({
  subject: Post,
  methods: {
    getAll: {
      onNoRules: 'allow',  // Override: allow if no rules for this method
    },
    patchOne: true,  // Use global onNoRules: 'deny'
  },
})
export class PostsController extends JsonBaseController<Post> {}
```

**Use cases:**

- **Strict mode** (`onNoRules: 'deny'`): Require explicit rules for every action
- **Development mode** (`onNoRules: 'allow'`): Allow access while rules are being developed
- **Per-method override**: Strict for mutations, relaxed for reads

**What happens with `onNoRules: 'allow'`:**

```typescript
AclPermissionsModule.forRoot({
  rulesLoader: MyRulesLoader,
  contextStore: ClsService,
  onNoRules: 'allow',  // Allow access if no rules + log warning
})

// If MyRulesLoader returns empty array:
async loadRules(subject, action) {
  return [];  // No rules!
}

// Result: Access ALLOWED + Warning in logs
// ⚠️ Warning: No ACL rules found for action 'getAll' on subject 'Post'. Access allowed by onNoRules: 'allow'
```

### JSON:API Actions Reference

The module uses JSON:API method names as actions. Here's the complete mapping:

| HTTP Method | Path | Action | Description |
|-------------|------|--------|-------------|
| GET | `/posts` | `getAll` | List all posts |
| GET | `/posts/:id` | `getOne` | Get single post |
| POST | `/posts` | `postOne` | Create new post |
| PATCH | `/posts/:id` | `patchOne` | Update post |
| DELETE | `/posts/:id` | `deleteOne` | Delete post |
| GET | `/posts/:id/relationships/:relName` | `getRelationship` | Get relationship data |
| POST | `/posts/:id/relationships/:relName` | `postRelationship` | Add to relationship |
| PATCH | `/posts/:id/relationships/:relName` | `patchRelationship` | Replace relationship |
| DELETE | `/posts/:id/relationships/:relName` | `deleteRelationship` | Remove from relationship |

**Example rules for all actions:**

```typescript
@Injectable()
export class MyRulesLoaderService implements AclRulesLoader {
  async loadRules<E>(entity: any, action: string): Promise<AclRule<E>[]> {
    if (entity === Post) {
      return [
        // Read access for all posts
        {
          action: 'getAll',
          subject: 'Post',
          fields: ['id', 'title', 'content', 'createdAt'], // Field-level restrictions
        },
        // Read single post
        {
          action: 'getOne',
          subject: 'Post',
          fields: ['id', 'title', 'content', 'createdAt', 'authorId'],
        },
        // Create new post
        {
          action: 'postOne',
          subject: 'Post',
        },
        // Update: only author can update
        {
          action: 'patchOne',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' }, // Entity-level condition
          fields: ['title', 'content'], // Can only update these fields
        },
        // Delete: only author can delete
        {
          action: 'deleteOne',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' },
        },
        // Relationship access
        {
          action: 'getRelationship',
          subject: 'Post',
          fields: ['author', 'comments'], // Can only access these relationships
        },
        {
          action: 'postRelationship',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' },
          fields: ['comments'], // Can only add comments
        },
        {
          action: 'patchRelationship',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' },
          fields: ['tags'], // Can only replace tags
        },
        {
          action: 'deleteRelationship',
          subject: 'Post',
          conditions: { authorId: '${currentUserId}' },
          fields: ['tags'], // Can only remove tags
        },
      ];
    }

    return []; // No rules for other entities
  }

  async getContext() {
    return {
      currentUserId: this.request.user?.id,
      role: this.request.user?.role,
    };
  }
}
```

---

## How ACL Works for Each Method

### getAll - List All Entities

**Flow:**

```typescript
GET /posts
↓
1. AclGuard checks: can('getAll', 'Post')
2. ORM Proxy intercepts ormService.getAll(query)
3. Prepare ACL query:
   - Extract conditions from ability.getQueryObject()
   - Extract field restrictions from ability.getQueryObject()
   - Merge user query with ACL query
4. Validate: no __current templates (not supported for getAll)
5. Execute query with ACL filtering (WHERE clauses)
6. Post-process results:
   - For each item: check field-level permissions
   - Build fieldRestrictions array for items with hidden fields
   - Transform to JSON:API format
7. Return: { meta: { fieldRestrictions }, data, included }
```

**Three ACL Scenarios:**

**1. No conditions, all fields (admin)**

```typescript
// Rule:
{
  action: 'getAll',
  subject: 'UserProfile',
  // No conditions = all records
  // No fields = all fields visible
}

// Result: All profiles with all fields
// GET /user-profiles
// => [
//      { id: 1, firstName: 'John', salary: 5000, role: 'admin', ... },
//      { id: 2, firstName: 'Jane', salary: 6000, role: 'moderator', ... }
//    ]
```

**2. No conditions, limited fields (moderator)**

```typescript
// Rule:
{
  action: 'getAll',
  subject: 'UserProfile',
  fields: ['id', 'firstName', 'lastName', 'avatar', 'phone'], // Only these fields
}

// Result: All profiles but some fields hidden
// GET /user-profiles
// => [
//      { id: 1, firstName: 'John', lastName: 'Doe', avatar: '...', phone: '...' },
//      // salary and role are REMOVED from response
//    ]
// meta: {
//   fieldRestrictions: [
//     { id: 1, fields: ['salary', 'role'] },
//     { id: 2, fields: ['salary', 'role'] }
//   ]
// }
```

**3. With conditions, per-item field restrictions (user)**

```typescript
// Rules:
[
  {
    action: 'getAll',
    subject: 'UserProfile',
    conditions: { isPublic: true }, // Only public profiles
    fields: ['id', 'firstName', 'lastName', 'avatar', 'bio'],
  },
  {
    action: 'getAll',
    subject: 'UserProfile',
    conditions: { userId: '${currentUserId}' }, // Own profile
    fields: ['id', 'firstName', 'lastName', 'avatar', 'bio', 'phone'], // + phone
  }
]

// Result: Filtered records + different fields per item
// GET /user-profiles
// => Database query: WHERE isPublic = true OR userId = 123
// => [
//      { id: 1, firstName: 'John', ... },           // public profile
//      { id: 2, firstName: 'Jane', phone: '...', ... }, // own profile (has phone)
//      { id: 3, firstName: 'Bob', ... }             // public profile
//    ]
// => Items 1,3: phone field REMOVED (not in first rule)
// => Item 2: phone field VISIBLE (matches second rule)
```

**Key Points:**

- ✅ **Database-level filtering**: `conditions` become WHERE clauses
- ✅ **Per-item field restrictions**: Each item can have different visible fields
- ✅ **Meta information**: `fieldRestrictions` tells which fields were hidden
- ✅ **Empty results**: If no records match ACL conditions, returns empty array per JSON:API spec
- ⚠️ **No `__current` support**: Cannot use `${@input.*}` in getAll (no single entity context)
- ⚠️ **Multiple rules merge**: If multiple rules match, fields are combined (union)

**Empty Result Example:**

```typescript
// Rules: Only public profiles OR own profile
[
  { action: 'getAll', subject: 'UserProfile', conditions: { isPublic: true } },
  { action: 'getAll', subject: 'UserProfile', conditions: { userId: 123 } }
]

// Database: No public profiles AND user 123 has no profile
// Result: Empty array (per JSON:API spec)
GET /user-profiles
=> {
     meta: { totalItems: 0, pageNumber: 1, pageSize: 25 },
     data: []
   }
```

**⚠️ IMPORTANT: Query Construction Safety**

The `ability.getQueryObject()` converts ACL conditions to database queries. **Be careful when writing rules** - complex conditions might fail to convert:

```typescript
// ❌ BAD: Complex nested conditions that might fail conversion
{
  conditions: {
    $or: [
      { 'profile.department.name': { $in: ['Sales', 'Marketing'] } },
      { 'permissions.admin': { $gt: 5 } }
    ]
  }
}

// ✅ GOOD: Simple, flat conditions
{
  conditions: {
    isPublic: true,
    authorId: '${currentUserId}'
  }
}
```

**Error Handling:**

If ACL rules produce an invalid database query:

- **Production mode** (`NODE_ENV=production`):
  - Returns **403 Forbidden** (masks DB error as ACL denial)
  - Logs error: `[ACL] Query error in getAllProxy for subject 'Post': <error details>`

- **Development mode**:
  - Returns **500 Internal Server Error** (exposes DB error for debugging)
  - Logs error with full stack trace

**Example:**

```typescript
// Rule with typo in field name:
{
  action: 'getAll',
  subject: 'Post',
  conditions: { auhtorId: 123 }  // typo: auhtorId instead of authorId
}

// Database error: column "auhtorId" does not exist
// → Production: 403 Forbidden
// → Development: 500 + "column 'auhtorId' does not exist"
```

**Recommendations:**

1. Test ACL rules thoroughly in development
2. Use simple, flat conditions whenever possible
3. Monitor logs for ACL query errors in production
4. Validate field names match your entity schema

---

### getOne - Get Single Entity

**Flow:**

```typescript
GET /posts/:id
↓
1. AclGuard checks: can('getOne', 'Post')
2. ORM Proxy intercepts ormService.getOne(id, query)
3. Prepare ACL query:
   - Extract conditions from ability.getQueryObject()
   - Extract field restrictions from ability.getQueryObject()
   - Merge user query with ACL query
4. Validate: no __current templates (not supported for getOne)
5. Execute query with ACL filtering (WHERE id = :id AND <ACL conditions>)
6. If not found → 404 Not Found
7. Post-process result:
   - Check field-level permissions for the item
   - Build fieldRestrictions if fields were hidden
   - Transform to JSON:API format
8. Return: { meta: { fieldRestrictions }, data, included }
```

**Three ACL Scenarios:**

**1. No conditions, all fields (admin)**

```typescript
// Rule:
{
  action: 'getOne',
  subject: 'UserProfile',
  // No conditions = can access any profile by ID
  // No fields = all fields visible
}

// Result: Any profile with all fields
// GET /user-profiles/1
// => { id: 1, firstName: 'John', salary: 5000, role: 'admin', ... }
```

**2. No conditions, limited fields (moderator)**

```typescript
// Rule:
{
  action: 'getOne',
  subject: 'UserProfile',
  fields: ['id', 'firstName', 'lastName', 'avatar', 'phone'],
}

// Result: Any profile but some fields hidden
// GET /user-profiles/1
// => { id: 1, firstName: 'John', lastName: 'Doe', avatar: '...', phone: '...' }
// salary and role are REMOVED
//
// meta: {
//   fieldRestrictions: [{ id: 1, fields: ['salary', 'role'] }]
// }
```

**3. With conditions, per-item field restrictions (user)**

```typescript
// Rules:
[
  {
    action: 'getOne',
    subject: 'UserProfile',
    conditions: { isPublic: true }, // Only public profiles
    fields: ['id', 'firstName', 'lastName', 'avatar', 'bio'],
  },
  {
    action: 'getOne',
    subject: 'UserProfile',
    conditions: { userId: '${currentUserId}' }, // Own profile
    fields: ['id', 'firstName', 'lastName', 'avatar', 'bio', 'phone'], // + phone
  }
]

// Scenario A: Own profile
// GET /user-profiles/123 (currentUserId = 123)
// => Database query: WHERE id = 123 AND (isPublic = true OR userId = 123)
// => { id: 123, firstName: 'John', phone: '...', ... }  // ✅ Has phone (own profile)

// Scenario B: Public profile
// GET /user-profiles/456 (other user's public profile)
// => Database query: WHERE id = 456 AND (isPublic = true OR userId = 123)
// => { id: 456, firstName: 'Jane', ... }  // ✅ No phone (public profile)

// Scenario C: Private profile of another user
// GET /user-profiles/789 (other user's private profile)
// => Database query: WHERE id = 789 AND (isPublic = true OR userId = 123)
// => No match (not public AND not own) → 404 Not Found
```

**Key Points:**

- ✅ **Database-level filtering**: `conditions` + ID filter combined with AND
- ✅ **Field restrictions**: Single item can have hidden fields
- ✅ **Meta information**: `fieldRestrictions` tells which fields were hidden
- ⚠️ **404 if not found**: If entity doesn't exist OR doesn't match ACL conditions → 404
- ⚠️ **No `__current` support**: Cannot use `${@input.*}` in getOne (no entity context yet)
- ⚠️ **Multiple rules merge**: If multiple rules match, fields are combined (union)

**404 Not Found vs 403 Forbidden:**

```typescript
// Scenario 1: Entity doesn't exist
GET /posts/99999 (doesn't exist)
→ 404 Not Found (standard behavior)

// Scenario 2: Entity exists but ACL denies access
GET /posts/5 (exists but not public, and not yours)
→ 404 Not Found (ACL filtered it out)

// Why 404 instead of 403?
// - Security: Don't leak information about resource existence
// - ACL filtering at DB level returns null → appears as "not found"
```

**Important:** getOne uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### deleteOne - Delete Single Entity

**Flow:**

```typescript
DELETE /posts/:id
↓
1. AclGuard checks: can('deleteOne', 'Post')
2. ORM Proxy intercepts ormService.deleteOne(id)
3. Fetch entity without ACL filtering (just by ID)
4. If not found → throw error (404)
5. Two-stage check with @input support:
   - updateWithInput(entity) - materialize rules with entity data
   - Check: can('deleteOne', subject('Post', entity))
6. If denied → 403 Forbidden
7. If allowed → execute delete
8. Return: void (successful deletion)
```

**Three ACL Scenarios:**

**1. No conditions (admin)**

```typescript
// Rule:
{
  action: 'deleteOne',
  subject: 'Article',
  // No conditions = can delete any article
}

// Result: Any article can be deleted
// DELETE /articles/1 → ✅ Success (200)
// DELETE /articles/2 → ✅ Success (200)
```

**2. Simple conditions with @input (moderator)**

```typescript
// Rule:
{
  action: 'deleteOne',
  subject: 'Article',
  conditions: { status: 'published' }, // Only published articles
}

// Scenario A: Article is published
// DELETE /articles/1 (article.status = 'published')
// → Fetch article → updateWithInput(article)
// → Check: can('deleteOne', article) → conditions match
// → ✅ Success (200)

// Scenario B: Article is draft
// DELETE /articles/2 (article.status = 'draft')
// → Fetch article → updateWithInput(article)
// → Check: can('deleteOne', article) → conditions don't match
// → ❌ 403 Forbidden
```

**3. Complex conditions with @input (user)**

```typescript
// Rule: Only author can delete unpublished articles
{
  action: 'deleteOne',
  subject: 'Article',
  conditions: {
    authorId: '${@input.authorId}',  // Must be author
    status: { $ne: 'published' }     // Cannot be published
  }
}

// Scenario A: Own draft article
// DELETE /articles/5 (authorId = 123, status = 'draft', currentUserId = 123)
// → Fetch article → updateWithInput(article)
// → Materialize: authorId: 123 (from @input), status != 'published'
// → Check: can('deleteOne', article) → ✅ Both conditions match
// → ✅ Success (200)

// Scenario B: Own published article
// DELETE /articles/6 (authorId = 123, status = 'published', currentUserId = 123)
// → Fetch article → updateWithInput(article)
// → Check: can('deleteOne', article) → ❌ status = 'published' (not allowed)
// → ❌ 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"deleteOne\"",
//     "path": ["action"]
//   }]
// }

// Scenario C: Someone else's draft article
// DELETE /articles/7 (authorId = 456, status = 'draft', currentUserId = 123)
// → Fetch article → updateWithInput(article)
// → Check: can('deleteOne', article) → ❌ authorId doesn't match
// → ❌ 403 Forbidden
```

**Key Points:**

- ✅ **Two-stage check**: Fetch entity first, then check with `@input` data
- ✅ **@input support**: Can use `${@input.field}` in conditions (access to entity data)
- ✅ **Instance-level check**: Rules evaluated against actual entity instance
- ⚠️ **403 on denial**: Returns 403 Forbidden (not 404) because entity exists and was loaded
- ⚠️ **No `__current` support**: Cannot compare old/new values (no update context)
- ⚠️ **No field restrictions**: `fields` parameter ignored for delete operations

**403 Forbidden vs 404 Not Found:**

```typescript
// Scenario 1: Entity doesn't exist
DELETE /articles/99999 (doesn't exist)
→ 404 Not Found (entity not found in getOne step)

// Scenario 2: Entity exists but ACL denies deletion
DELETE /articles/5 (exists but conditions don't match)
→ 403 Forbidden (entity loaded, ACL check failed)

// Why different from getOne?
// - getOne: ACL filtering at DB level (appears as "not found")
// - deleteOne: ACL check after loading entity (explicit denial)
```

**Why two-stage check?**

deleteOne needs access to entity data for `@input` templates:

```typescript
// This rule needs entity data:
{
  conditions: {
    authorId: '${@input.authorId}',        // From entity
    status: { $ne: 'published' },           // From entity
    createdAt: { $gt: '${@input.yesterday}' } // Computed from entity
  }
}

// Flow:
// 1. Fetch entity (no ACL filtering)
// 2. updateWithInput(entity) - materialize with entity data
// 3. Check can('deleteOne', entity) - evaluate conditions
// 4. Delete if allowed
```

**Important:** deleteOne uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### postOne - Create New Entity

**Flow:**

```typescript
POST /posts
↓
1. AclGuard checks: can('postOne', 'Post')
2. ORM Proxy intercepts ormService.postOne(inputData)
3. Load relationships (if provided in request)
4. Build entity from attributes + loaded relationships
5. Two-stage check with @input support:
   - updateWithInput(entity) - materialize rules with input data
   - Check entity-level: can('postOne', subject('Post', entity))
   - Check field-level: for each changed field → can('postOne', entity, field)
6. If denied → 403 Forbidden (entity or field)
7. If allowed → execute create
8. Return: created entity with ID
```

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'postOne',
  subject: 'Article',
  // No conditions = can create with any data
  // No fields = can set any fields
}

// Result: Can create articles with any author
// POST /articles
// body: { authorId: 123, status: 'published', ... }
// → ✅ Success (201)
//
// body: { authorId: 456, status: 'published', ... }
// → ✅ Success (201)
```

**2. Conditions with @input (moderator)**

```typescript
// Rule: Can only create articles where they are the author
{
  action: 'postOne',
  subject: 'Article',
  conditions: {
    authorId: '${@input.authorId}',  // Must match input authorId
  }
}

// Scenario A: Creating with own author
// POST /articles (currentUserId = 123)
// body: { authorId: 123, status: 'published', ... }
// → Build entity → updateWithInput({ authorId: 123, ... })
// → Materialize: authorId: 123 (from @input)
// → Check: can('postOne', entity) → ✅ authorId matches
// → ✅ Success (201)

// Scenario B: Creating with different author
// POST /articles (currentUserId = 123)
// body: { authorId: 456, status: 'published', ... }
// → Build entity → updateWithInput({ authorId: 456, ... })
// → Check: can('postOne', entity) → ❌ authorId doesn't match (456 != 123)
// → ❌ 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"postOne\"",
//     "path": ["action"]
//   }]
// }
```

**3. Conditions + field restrictions (user)**

```typescript
// Rule: Can create draft articles, only specific fields allowed
{
  action: 'postOne',
  subject: 'Article',
  conditions: {
    authorId: '${@input.authorId}',  // Must be own article
    status: 'draft'                   // Must be draft
  },
  fields: ['title', 'content', 'authorId', 'status']  // Only these fields
}

// Scenario A: Create draft with allowed fields
// POST /articles (currentUserId = 123)
// body: { authorId: 123, status: 'draft', title: 'Test', content: '...' }
// → Build entity → updateWithInput(entity)
// → Check entity: can('postOne', entity) → ✅ Conditions match
// → Check fields:
//   - can('postOne', entity, 'authorId') → ✅ In fields list
//   - can('postOne', entity, 'status') → ✅ In fields list
//   - can('postOne', entity, 'title') → ✅ In fields list
//   - can('postOne', entity, 'content') → ✅ In fields list
// → ✅ Success (201)

// Scenario B: Try to create published article
// POST /articles (currentUserId = 123)
// body: { authorId: 123, status: 'published', title: 'Test' }
// → Build entity → updateWithInput(entity)
// → Check entity: can('postOne', entity) → ❌ status != 'draft'
// → ❌ 403 Forbidden (entity-level)

// Scenario C: Try to set forbidden field
// POST /articles (currentUserId = 123)
// body: { authorId: 123, status: 'draft', title: 'Test', publishedAt: new Date() }
// → Build entity → updateWithInput(entity)
// → Check entity: can('postOne', entity) → ✅ Conditions match
// → Check fields:
//   - can('postOne', entity, 'authorId') → ✅ Allowed
//   - can('postOne', entity, 'status') → ✅ Allowed
//   - can('postOne', entity, 'title') → ✅ Allowed
//   - can('postOne', entity, 'publishedAt') → ❌ NOT in fields list!
// → ❌ 403 Forbidden (field-level)
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow to set field \"publishedAt\"",
//     "path": ["data", "attributes", "publishedAt"]
//   }]
// }
```

**Key Points:**

- ✅ **Two-stage check**: Entity-level check + field-level check for each input field
- ✅ **@input support**: Can use `${@input.field}` in conditions (access to input data)
- ✅ **Field-level restrictions**: Each input field checked individually with `can(action, entity, field)`
- ✅ **Relationships loaded**: If relationships provided, they are loaded and merged with attributes
- ⚠️ **403 on denial**: Returns 403 Forbidden with specific error (entity or field)
- ⚠️ **No `__current` support**: Cannot compare old/new values (no existing entity context)
- ⚠️ **Changed fields only**: Only fields present in input (attributes + relationships) are checked

**Entity-level vs Field-level errors:**

```typescript
// Entity-level error (conditions don't match):
{
  "errors": [{
    "code": "forbidden",
    "message": "not allow \"postOne\"",
    "path": ["action"]
  }]
}

// Field-level error (specific field not allowed):
{
  "errors": [{
    "code": "forbidden",
    "message": "not allow to set field \"publishedAt\"",
    "path": ["data", "attributes", "publishedAt"]  // Precise location
  }]
}
```

**Why two checks?**

postOne needs fine-grained control:

1. **Entity-level**: Validate overall entity state (e.g., "must be draft", "must be own article")
2. **Field-level**: Validate which fields user can set (e.g., "can't set publishedAt", "can't set adminOnly fields")

This allows rules like: "Users can create draft posts but can't set publishedAt or moderatorNotes fields"

**Important:** postOne uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### patchOne - Update Single Entity

**Flow:**

```typescript
PATCH /posts/:id
↓
1. AclGuard checks: can('patchOne', 'Post')
2. ORM Proxy intercepts ormService.patchOne(id, inputData)
3. Fetch entity from database (with ACL conditions for access check)
4. If not found → 404 Not Found
5. Load relationships (if provided in request)
6. Detect changed fields (compare old vs new values)
7. Build entity for check with __current:
   - Root level: NEW values (after applying changes)
   - __current: OLD values (from database)
8. Two-stage check with @input + __current support:
   - updateWithInput(entityForCheck) - materialize rules with old/new data
   - Check entity-level: can('patchOne', subject('Post', entityForCheck))
   - Check field-level: for each changed field → can('patchOne', entityForCheck, field)
9. If denied → 403 Forbidden (entity or field)
10. If allowed → execute update
11. Return: updated entity
```

**The `__current` Magic 🪄**

patchOne has a unique feature: access to **both old and new values** simultaneously:

```typescript
// Entity structure during ACL check:
{
  ...newValues,           // Root level: values AFTER update
  __current: oldValues    // Nested: values BEFORE update (from DB)
}
```

This enables rules like:
- "Allow changing status from draft to review, but not to published"
- "Allow removing only yourself from coAuthors"
- "Allow increasing price, but not decreasing it"

**⚠️ Yes, this looks a bit hacky** (we know! 😅), but after extensive brainstorming, this was the cleanest solution we found for comparing old/new values in CASL rules. **If you have a better idea**, we'd love to hear it! Open a [GitHub discussion](https://github.com/klerick/nestjs-json-api/discussions) or submit a PR! 🙏

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'patchOne',
  subject: 'Article',
  // No conditions = can update any article
  // No fields = can update any fields
}

// Result: Can update any article, any fields
// PATCH /articles/1
// body: { title: 'New title', status: 'published' }
// → ✅ Success (200)
```

**2. Field restrictions + value validation (moderator)**

```typescript
// Rule: Can update non-published articles, specific fields + value constraints
{
  action: 'patchOne',
  subject: 'Article',
  conditions: {
    '__current.status': { $ne: 'published' }  // ⚠️ Using __current!
  },
  fields: ['status', 'content']  // Only these fields can be changed
}

// Additional field-level rules with value constraints:
{
  action: 'patchOne',
  subject: 'Article',
  conditions: {
    '__current.status': { $ne: 'published' },
    'status': { $in: ['draft', 'review'] }  // Can only set to draft or review
  },
  fields: ['status']
}

// Scenario A: Update draft article with allowed field
// PATCH /articles/1 (current status = 'draft')
// body: { status: 'review' }
// → Fetch article (status: 'draft')
// → Build entityForCheck: { status: 'review', __current: { status: 'draft', ... } }
// → Check entity: __current.status != 'published' ✅, status in ['draft', 'review'] ✅
// → Check field 'status': in fields list ✅
// → ✅ Success (200)

// Scenario B: Try to update published article
// PATCH /articles/2 (current status = 'published')
// body: { status: 'review' }
// → entityForCheck: { status: 'review', __current: { status: 'published', ... } }
// → Check entity: __current.status != 'published' ❌
// → ❌ 403 Forbidden (entity-level)

// Scenario C: Try to change not-allowed field
// PATCH /articles/1 (current status = 'draft')
// body: { title: 'New title' }
// → Changed fields: ['title']
// → Check field 'title': NOT in fields list ❌
// → ❌ 403 Forbidden (field-level)
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow to modify field \"title\"",
//     "path": ["data", "attributes", "title"]
//   }]
// }

// Scenario D: Try to set forbidden value
// PATCH /articles/1 (current status = 'draft')
// body: { status: 'published' }
// → entityForCheck: { status: 'published', __current: { status: 'draft', ... } }
// → Check entity: status NOT in ['draft', 'review'] ❌
// → ❌ 403 Forbidden (entity-level)
```

**3. Complex __current rule: Remove only yourself from coAuthors (user)**

```typescript
// In your RulesLoader service (implements AclRulesLoader interface)
@Injectable()
export class MyRulesLoaderService implements AclRulesLoader {
  // Helper functions available in rules
  async getHelpers(): Promise<Record<string, (...args: unknown[]) => unknown>> {
    return {
      // Helper to calculate expected array (old array without user)
      removeMyselfOnly: (oldArray: number[], userId: number): number[] => {
        return oldArray.filter(id => id !== userId);
      }
    };
  }

  async loadRules<E>(entity: any, action: string): Promise<AclRule<E>[]> {
    // ... your rules
  }
}

// Module configuration
AclPermissionsModule.forRoot({
  rulesLoader: MyRulesLoaderService,  // ← Helper functions come from here
  contextStore: ClsService,
  onNoRules: 'deny',
})

// Rule: CoAuthor can update ONLY to remove themselves from coAuthorIds
{
  action: 'patchOne',
  subject: 'Article',
  conditions: {
    '__current.coAuthorIds': { $in: ['${currentUser.id}'] },  // WAS in old array
    'coAuthorIds': {
      $all: '${removeMyselfOnly(@input.__current.coAuthorIds, currentUser.id)}',  // New array = old array - self
      $size: '${@input.__current.coAuthorIds.length - 1}'  // Size decreased by 1
    }
  },
  fields: ['coAuthorIds']
}

// Additional rule: Author can update article
{
  action: 'patchOne',
  subject: 'Article',
  conditions: {
    'authorId': '${currentUser.id}'  // Is the author
  }
}

// Scenario A: CoAuthor removes only themselves ✅
// PATCH /articles/1 (currentUserId = 5, article.coAuthorIds = [3, 5, 7])
// body: { coAuthorIds: [3, 7] }  // Removed 5
// → entityForCheck: {
//     coAuthorIds: [3, 7],
//     __current: { coAuthorIds: [3, 5, 7], ... }
//   }
// → Materialize:
//     __current.coAuthorIds: [3, 5, 7] contains 5 ✅
//     coAuthorIds: [3, 7] does NOT contain 5 ✅
// → ✅ Success (200) - Removed themselves

// Scenario B: CoAuthor tries to add someone ❌
// PATCH /articles/1 (currentUserId = 5, article.coAuthorIds = [3, 5, 7])
// body: { coAuthorIds: [3, 5, 7, 9] }  // Added 9, kept themselves
// → entityForCheck: {
//     coAuthorIds: [3, 5, 7, 9],
//     __current: { coAuthorIds: [3, 5, 7], ... }
//   }
// → Check: coAuthorIds contains 5 ❌ (must NOT contain for rule to match)
// → ❌ 403 Forbidden

// Scenario C: CoAuthor removes themselves + adds someone ❌
// PATCH /articles/1 (currentUserId = 5, article.coAuthorIds = [3, 5, 7])
// body: { coAuthorIds: [3, 7, 9] }  // Removed 5, added 9
// → Check entity-level: 5 was in old ✅, 5 not in new ✅
// → BUT coAuthorIds field changed from [3, 5, 7] to [3, 7, 9]
// → This changes OTHER authors (added 9) → field validation fails
// → ❌ 403 Forbidden (entity-level passes, but adding others violates intent)

// Scenario D: Author updates article ✅
// PATCH /articles/1 (currentUserId = 10, article.authorId = 10)
// body: { title: 'New title' }
// → Matches second rule (authorId matches)
// → ✅ Success (200)
```

**Why this `__current` pattern?**

This rule prevents coAuthors from:
- ❌ Adding other coAuthors
- ❌ Removing other coAuthors
- ❌ Staying in the array (keeping themselves)

They can ONLY:
- ✅ Remove themselves completely

Without `__current`, you couldn't express "was present but now removed" logic!

**Key Points:**

- ✅ **Two-stage check**: Entity-level + field-level for each changed field
- ✅ **@input support**: Access to new values via `${@input.field}`
- ✅ **__current support**: Access to old values via `${@input.__current.field}` 🪄
- ✅ **Changed fields detection**: Compares DB values vs request values
- ✅ **Field-level restrictions**: Each changed field checked individually
- ✅ **Relationships loaded**: If relationships in request, they are loaded
- ⚠️ **403 on denial**: Returns 403 Forbidden (entity or field)
- ⚠️ **Only changed fields checked**: Unchanged fields are not validated

**Changed Fields Detection:**

patchOne compares old (DB) vs new (request) values to detect changes:

```typescript
// Comparison strategy:
// - Primitives (string, number, boolean, null): strict equality (===)
// - Date objects: toISOString() comparison
// - Objects/Arrays: JSON.stringify comparison

// Examples:
// Old: { title: 'Hello' }
// New: { title: 'Hello' }
// → Changed: [] (no changes)

// Old: { title: 'Hello' }
// New: { title: 'World' }
// → Changed: ['title']

// Old: { tags: [1, 2, 3] }
// New: { tags: [1, 2, 3] }
// → Changed: [] (JSON.stringify matches)

// Old: { tags: [1, 2, 3] }
// New: { tags: [1, 2, 3, 4] }
// → Changed: ['tags'] (JSON.stringify differs)
```

**⚠️ Known Edge Cases (~10% of use cases):**

1. **JSONB fields with different key order** may trigger false positives:
   ```typescript
   // Old: { metadata: { a: 1, b: 2 } }
   // New: { metadata: { b: 2, a: 1 } }
   // → Detected as CHANGED (JSON.stringify differs)
   // → But content is identical!
   ```

2. **Date comparison**: Uses `toISOString()`, so different Date objects with same time are treated as equal.

3. **Circular references**: Not expected in JSON:API requests (would fail JSON.parse anyway).

**If you encounter issues with changed field detection, please [create a GitHub issue](https://github.com/klerick/nestjs-json-api/issues) with your use case!**

**Entity-level vs Field-level errors:**

```typescript
// Entity-level error (__current conditions don't match):
{
  "errors": [{
    "code": "forbidden",
    "message": "not allow \"patchOne\"",
    "path": ["action"]
  }]
}

// Field-level error (specific field not allowed):
{
  "errors": [{
    "code": "forbidden",
    "message": "not allow to modify field \"status\"",
    "path": ["data", "attributes", "status"]
  }]
}
```

**Important:** patchOne uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### getRelationship - Get Relationship Data

**Flow:**

```typescript
GET /posts/:id/relationships/:relName
↓
1. AclGuard checks: can('getRelationship', 'Post')
2. ORM Proxy intercepts ormService.getRelationship(id, relName)
3. Prepare ACL query with relationship include
4. Fetch entity with relationship (getOne with ACL conditions + include)
5. If not found → 404 Not Found
6. Two-stage check with @input + field-level:
   - updateWithInput(entity) - materialize rules with entity data
   - Check: can('getRelationship', subject('Post', entity), relName)
7. If denied → 403 Forbidden
8. If allowed → return relationship data
```

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'getRelationship',
  subject: 'UsersAcl',
  // No conditions = can access any user's relationships
  // No fields = can access all relationships
}

// Result: Can access any relationship for any user
// GET /users-acl/1/relationships/profile → ✅ Success (200)
// GET /users-acl/1/relationships/posts → ✅ Success (200)
// GET /users-acl/2/relationships/profile → ✅ Success (200)
```

**2. No conditions, with field restrictions (moderator)**

```typescript
// Rule:
{
  action: 'getRelationship',
  subject: 'UsersAcl',
  fields: ['posts'],  // Only 'posts' relationship allowed
}

// Scenario A: Access allowed relationship
// GET /users-acl/1/relationships/posts
// → Fetch user with posts → updateWithInput(user)
// → Check: can('getRelationship', user, 'posts') → ✅ 'posts' in fields
// → ✅ Success (200)

// Scenario B: Access forbidden relationship
// GET /users-acl/1/relationships/profile
// → Fetch user with profile → updateWithInput(user)
// → Check: can('getRelationship', user, 'profile') → ❌ 'profile' NOT in fields
// → ❌ 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"getRelationship\"",
//     "path": ["action"]
//   }]
// }
```

**3. With conditions + field restrictions (user)**

```typescript
// Rule: Can only access own relationships
{
  action: 'getRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}'  // Must be own user
  },
  fields: ['profile', 'posts']  // Only these relationships
}

// Scenario A: Access own profile relationship
// GET /users-acl/5/relationships/profile (currentUser.id = 5)
// → Database query: WHERE id = 5 AND id = 5 (conditions match)
// → Fetch user → updateWithInput(user)
// → Check: can('getRelationship', user, 'profile') → ✅ 'profile' in fields
// → ✅ Success (200)

// Scenario B: Access own posts relationship
// GET /users-acl/5/relationships/posts (currentUser.id = 5)
// → Fetch user → updateWithInput(user)
// → Check: can('getRelationship', user, 'posts') → ✅ 'posts' in fields
// → ✅ Success (200)

// Scenario C: Try to access other user's profile
// GET /users-acl/10/relationships/profile (currentUser.id = 5)
// → Database query: WHERE id = 10 AND id = 5 (conditions don't match)
// → Entity not found (filtered by ACL conditions)
// → ❌ 403 Forbidden

// Scenario D: Try to access forbidden relationship
// GET /users-acl/5/relationships/comments (currentUser.id = 5)
// → Fetch user → updateWithInput(user)
// → Check: can('getRelationship', user, 'comments') → ❌ 'comments' NOT in fields
// → ❌ 403 Forbidden
```

**Key Points:**

- ✅ **Two-stage check**: Entity-level (fetch with conditions) + field-level (relationship name)
- ✅ **@input support**: Can use `${@input.field}` in conditions (entity data available)
- ✅ **Field = Relationship name**: `fields` array contains allowed relationship names
- ✅ **404 vs 403**: Entity not found (conditions) → 403, relationship not allowed (fields) → 403
- ⚠️ **No `__current` support**: Cannot use `${@input.__current.*}` (not supported for getRelationship)
- ⚠️ **Entity fetched with relationship**: Uses getOne under the hood with include

**How field-level check works:**

```typescript
// fields parameter contains relationship names:
{
  action: 'getRelationship',
  subject: 'Post',
  fields: ['author', 'comments', 'tags']  // Allowed relationships
}

// Check performed:
can('getRelationship', entity, 'author')    // ✅ in fields
can('getRelationship', entity, 'comments')  // ✅ in fields
can('getRelationship', entity, 'tags')      // ✅ in fields
can('getRelationship', entity, 'category')  // ❌ NOT in fields → 403
```

**404 Not Found vs 403 Forbidden:**

```typescript
// Scenario 1: Entity doesn't exist
GET /posts/99999/relationships/author
→ 404 Not Found (entity not found)

// Scenario 2: Entity exists but ACL conditions deny access
GET /posts/5/relationships/author (conditions don't match)
→ 403 Forbidden (filtered by ACL conditions)

// Scenario 3: Entity exists, conditions match, but relationship not allowed
GET /posts/5/relationships/author (entity accessible, but 'author' not in fields)
→ 403 Forbidden (relationship not in fields list)

// Why 403 instead of 404?
// - Consistent with getOne behavior when ACL filters
// - Don't leak information about resource existence
```

**Important:** getRelationship uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### deleteRelationship - Remove from Relationship

**Flow:**

```typescript
DELETE /posts/:id/relationships/:relName
↓
1. AclGuard checks: can('deleteRelationship', 'Post')
2. ORM Proxy intercepts ormService.deleteRelationship(id, relName, input)
3. Prepare ACL query with relationship include
4. Fetch entity with relationship (getOne with ACL conditions + include)
5. If not found → 404 Not Found
6. Filter relationship items to only those being deleted (from input.data)
7. Two-stage check with @input + field-level:
   - updateWithInput(filteredEntity) - materialize rules with filtered data
   - Check: can('deleteRelationship', subject('Post', filteredEntity), relName)
8. If denied → 403 Forbidden
9. If allowed → execute delete
10. Return: void (successful deletion)
```

**⚠️ Important filtering behavior:**

Before ACL check, the relationship items are filtered to **only those being deleted**:

```typescript
// Request: DELETE /users/5/relationships/aclComments
// body: { data: [{ type: 'comments', id: 10 }, { type: 'comments', id: 20 }] }

// Entity from DB: { id: 5, aclComments: [10, 15, 20, 25] }
// Filtered for ACL check: { id: 5, aclComments: [10, 20] }  // Only items being deleted!
```

This allows rules like: "Can delete only comments authored by current user"

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'deleteRelationship',
  subject: 'UsersAcl',
  // No conditions = can delete any user's relationships
  // No fields = can delete all relationships
}

// Result: Can delete any relationship for any user
// DELETE /users-acl/1/relationships/aclComments → ✅ Success (200)
// DELETE /users-acl/1/relationships/posts → ✅ Success (200)
// DELETE /users-acl/2/relationships/aclComments → ✅ Success (200)
```

**2. No conditions, with field restrictions (moderator)**

```typescript
// Rule:
{
  action: 'deleteRelationship',
  subject: 'UsersAcl',
  fields: ['posts'],  // Only 'posts' relationship allowed
}

// Scenario A: Delete allowed relationship
// DELETE /users-acl/1/relationships/posts
// body: { data: [{ type: 'posts', id: 5 }] }
// → Fetch user with posts → Filter to posts being deleted
// → updateWithInput(user) → Check: can('deleteRelationship', user, 'posts')
// → ✅ 'posts' in fields → Success (200)

// Scenario B: Delete forbidden relationship
// DELETE /users-acl/1/relationships/aclComments
// body: { data: [{ type: 'comments', id: 10 }] }
// → Fetch user with aclComments → Filter to comments being deleted
// → updateWithInput(user) → Check: can('deleteRelationship', user, 'aclComments')
// → ❌ 'aclComments' NOT in fields → 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"deleteRelationship\"",
//     "path": ["action"]
//   }]
// }
```

**3. With conditions + field restrictions (user)**

```typescript
// Rule: Can only delete own aclComments
{
  action: 'deleteRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}'  // Must be own user
  },
  fields: ['aclComments']  // Only this relationship
}

// Scenario A: Delete own comments
// DELETE /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 10 }, { type: 'comments', id: 20 }] }
// → Database query: WHERE id = 5 AND id = 5 (conditions match)
// → Fetch user with aclComments: { id: 5, aclComments: [10, 15, 20, 25] }
// → Filter to items being deleted: { id: 5, aclComments: [10, 20] }
// → updateWithInput(filteredUser)
// → Check: can('deleteRelationship', user, 'aclComments')
// → ✅ conditions match + 'aclComments' in fields → Success (200)

// Scenario B: Try to delete someone else's comments
// DELETE /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 30 }] }
// → Database query: WHERE id = 10 AND id = 5 (conditions don't match)
// → Entity not found (filtered by ACL conditions)
// → ❌ 403 Forbidden

// Scenario C: Try to delete forbidden relationship
// DELETE /users-acl/5/relationships/posts (currentUser.id = 5)
// body: { data: [{ type: 'posts', id: 7 }] }
// → Fetch user → Filter → updateWithInput(user)
// → Check: can('deleteRelationship', user, 'posts')
// → ❌ 'posts' NOT in fields → 403 Forbidden
```

**Advanced: Conditional delete based on relationship content**

The filtering behavior enables powerful rules based on what's being deleted:

```typescript
// Rule: User can delete ONLY their own comments from ANY user's aclComments
{
  action: 'deleteRelationship',
  subject: 'UsersAcl',
  conditions: {
    'aclComments': {
      $all: { authorId: '${currentUser.id}' }  // All items being deleted must be authored by current user
    }
  },
  fields: ['aclComments']
}

// Scenario A: Delete only own comments ✅
// DELETE /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 100 }, { type: 'comments', id: 105 }] }
// → Fetch user: { id: 10, aclComments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 102, authorId: 10, text: '...' },
//     { id: 105, authorId: 5, text: '...' }
//   ]}
// → Filter to items being deleted: { id: 10, aclComments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 105, authorId: 5, text: '...' }
//   ]}
// → Check: All items have authorId = 5 ✅ → Success (200)

// Scenario B: Try to delete someone else's comment ❌
// DELETE /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 100 }, { type: 'comments', id: 102 }] }
// → Filter to items being deleted: { id: 10, aclComments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 102, authorId: 10, text: '...' }  // ← Not by current user!
//   ]}
// → Check: NOT all items have authorId = 5 ❌ → 403 Forbidden
```

**Key Points:**

- ✅ **Two-stage check**: Entity-level (fetch with conditions) + field-level (relationship name)
- ✅ **@input support**: Can use `${@input.field}` in conditions (entity data available)
- ✅ **Filtered data**: Entity filtered to only items being deleted before ACL check
- ✅ **Field = Relationship name**: `fields` array contains allowed relationship names
- ✅ **Powerful conditions**: Can check properties of items being deleted
- ⚠️ **No `__current` support**: Cannot use `${@input.__current.*}` (not supported)
- ⚠️ **To-many vs to-one**: Filtering works for both relationship types

**How filtering works:**

```typescript
// To-many relationship (array):
// DB: { id: 5, comments: [1, 2, 3, 4, 5] }
// Request: DELETE comments [2, 4]
// Filtered: { id: 5, comments: [2, 4] }  // Only items being deleted

// To-one relationship (single object):
// DB: { id: 5, author: { id: 10, name: 'John' } }
// Request: DELETE author
// Filtered: { id: 5, author: { id: 10, name: 'John' } }  // Kept as-is
```

**404 Not Found vs 403 Forbidden:**

```typescript
// Scenario 1: Entity doesn't exist
DELETE /posts/99999/relationships/comments
→ 404 Not Found (entity not found)

// Scenario 2: Entity exists but ACL conditions deny access
DELETE /posts/5/relationships/comments (conditions don't match)
→ 403 Forbidden (filtered by ACL conditions)

// Scenario 3: Entity exists, conditions match, but relationship not allowed
DELETE /posts/5/relationships/comments (entity accessible, but 'comments' not in fields)
→ 403 Forbidden (relationship not in fields list)

// Why 403 instead of 404?
// - Consistent with other relationship methods
// - Don't leak information about resource existence
```

**Use cases:**

1. **Simple field restriction**: "Users can only delete posts relationships, not comments"
2. **Owner-only deletion**: "Users can only delete relationships from their own entities"
3. **Content-based deletion**: "Users can only delete comments they authored"
4. **Hybrid**: "Moderators can delete any comments, users only their own"

**Important:** deleteRelationship uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### postRelationship - Add to Relationship

**Flow:**

```typescript
POST /posts/:id/relationships/:relName
↓
1. AclGuard checks: can('postRelationship', 'Post')
2. ORM Proxy intercepts ormService.postRelationship(id, relName, input)
3. Prepare ACL query (without relationship include)
4. Fetch entity without relationships (getOne with ACL conditions, no include)
5. If not found → 404 Not Found
6. Load relationships being added (from input.data) via loadRelations
7. Merge entity with loaded relationships
8. Two-stage check with @input + field-level:
   - updateWithInput(mergedEntity) - materialize rules with entity + new relationships
   - Check: can('postRelationship', subject('Post', mergedEntity), relName)
9. If denied → 403 Forbidden
10. If allowed → execute add
11. Return: void (successful addition)
```

**⚠️ Important: Relationship Loading**

Before ACL check, **new relationships are loaded** from the input:

```typescript
// Request: POST /users/5/relationships/aclComments
// body: { data: [{ type: 'comments', id: 10 }, { type: 'comments', id: 20 }] }

// Entity from DB: { id: 5, aclComments: [15, 25] }  // Existing comments
// Load relationships: [{ id: 10, authorId: 5, ... }, { id: 20, authorId: 3, ... }]  // NEW comments
// Merged for ACL check: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }  // Only NEW!
```

This allows rules like: "Can add only comments authored by current user"

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'postRelationship',
  subject: 'UsersAcl',
  // No conditions = can add to any user's relationships
  // No fields = can add to all relationships
}

// Result: Can add to any relationship for any user
// POST /users-acl/1/relationships/aclComments → ✅ Success (200)
// POST /users-acl/1/relationships/posts → ✅ Success (200)
// POST /users-acl/2/relationships/aclComments → ✅ Success (200)
```

**2. No conditions, with field restrictions (moderator)**

```typescript
// Rule:
{
  action: 'postRelationship',
  subject: 'UsersAcl',
  fields: ['posts'],  // Only 'posts' relationship allowed
}

// Scenario A: Add to allowed relationship
// POST /users-acl/1/relationships/posts
// body: { data: [{ type: 'posts', id: 5 }] }
// → Fetch user → Load post (id: 5)
// → Merge: { id: 1, posts: [{ id: 5, ... }] }
// → updateWithInput(merged) → Check: can('postRelationship', user, 'posts')
// → ✅ 'posts' in fields → Success (200)

// Scenario B: Add to forbidden relationship
// POST /users-acl/1/relationships/aclComments
// body: { data: [{ type: 'comments', id: 10 }] }
// → Fetch user → Load comment (id: 10)
// → Merge: { id: 1, aclComments: [{ id: 10, ... }] }
// → updateWithInput(merged) → Check: can('postRelationship', user, 'aclComments')
// → ❌ 'aclComments' NOT in fields → 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"postRelationship\"",
//     "path": ["action"]
//   }]
// }
```

**3. With conditions + field restrictions (user)**

```typescript
// Rule: Can only add aclComments to own user
{
  action: 'postRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}'  // Must be own user
  },
  fields: ['aclComments']  // Only this relationship
}

// Scenario A: Add to own aclComments
// POST /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 10 }, { type: 'comments', id: 20 }] }
// → Database query: WHERE id = 5 AND id = 5 (conditions match)
// → Fetch user: { id: 5, aclComments: [15, 25] }
// → Load relationships: [{ id: 10, ... }, { id: 20, ... }]
// → Merge: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
// → updateWithInput(merged)
// → Check: can('postRelationship', user, 'aclComments')
// → ✅ conditions match + 'aclComments' in fields → Success (200)

// Scenario B: Try to add to someone else's aclComments
// POST /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 30 }] }
// → Database query: WHERE id = 10 AND id = 5 (conditions don't match)
// → Entity not found (filtered by ACL conditions)
// → ❌ 403 Forbidden

// Scenario C: Try to add to forbidden relationship
// POST /users-acl/5/relationships/posts (currentUser.id = 5)
// body: { data: [{ type: 'posts', id: 7 }] }
// → Fetch user → Load post → Merge
// → Check: can('postRelationship', user, 'posts')
// → ❌ 'posts' NOT in fields → 403 Forbidden
```

**Advanced: Conditional add based on relationship content**

The loading behavior enables powerful rules based on what's being added:

```typescript
// Rule: User can add ONLY their own comments to ANY user's aclComments
{
  action: 'postRelationship',
  subject: 'UsersAcl',
  conditions: {
    'aclComments': {
      $all: { authorId: '${currentUser.id}' }  // All items being added must be authored by current user
    }
  },
  fields: ['aclComments']
}

// Scenario A: Add only own comments ✅
// POST /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 100 }, { type: 'comments', id: 105 }] }
// → Fetch user: { id: 10, aclComments: [...] }
// → Load comments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 105, authorId: 5, text: '...' }
//   ]
// → Merge: { id: 10, aclComments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 105, authorId: 5, text: '...' }
//   ]}
// → Check: All items have authorId = 5 ✅ → Success (200)

// Scenario B: Try to add someone else's comment ❌
// POST /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 100 }, { type: 'comments', id: 102 }] }
// → Load comments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 102, authorId: 10, text: '...' }  // ← Not by current user!
//   ]
// → Merge: { id: 10, aclComments: [
//     { id: 100, authorId: 5, text: '...' },
//     { id: 102, authorId: 10, text: '...' }
//   ]}
// → Check: NOT all items have authorId = 5 ❌ → 403 Forbidden
```

**Key Points:**

- ✅ **Two-stage check**: Entity-level (fetch with conditions) + field-level (relationship name)
- ✅ **@input support**: Can use `${@input.field}` in conditions (entity + new relationships available)
- ✅ **Loaded relationships**: New relationships loaded via `loadRelations` before ACL check
- ✅ **Field = Relationship name**: `fields` array contains allowed relationship names
- ✅ **Powerful conditions**: Can check properties of items being added
- ⚠️ **No `__current` support**: Cannot use `${@input.__current.*}` (not supported)
- ⚠️ **To-many vs to-one**: Loading works for both relationship types

**How loading works:**

```typescript
// To-many relationship (array):
// DB: { id: 5, comments: [1, 2, 3] }  // Existing
// Request: POST comments [4, 5]
// Loaded: [{ id: 4, ... }, { id: 5, ... }]
// Merged: { id: 5, comments: [{ id: 4, ... }, { id: 5, ... }] }  // Only NEW items!

// To-one relationship (single object):
// DB: { id: 5, author: { id: 10, name: 'John' } }  // Existing
// Request: POST author [{ id: 20 }]
// Loaded: { id: 20, name: 'Jane' }
// Merged: { id: 5, author: { id: 20, name: 'Jane' } }  // NEW author replaces
```

**404 Not Found vs 403 Forbidden:**

```typescript
// Scenario 1: Entity doesn't exist
POST /posts/99999/relationships/comments
→ 404 Not Found (entity not found)

// Scenario 2: Entity exists but ACL conditions deny access
POST /posts/5/relationships/comments (conditions don't match)
→ 403 Forbidden (filtered by ACL conditions)

// Scenario 3: Entity exists, conditions match, but relationship not allowed
POST /posts/5/relationships/comments (entity accessible, but 'comments' not in fields)
→ 403 Forbidden (relationship not in fields list)

// Why 403 instead of 404?
// - Consistent with other relationship methods
// - Don't leak information about resource existence
```

**Use cases:**

1. **Simple field restriction**: "Users can only add posts relationships, not comments"
2. **Owner-only addition**: "Users can only add relationships to their own entities"
3. **Content-based addition**: "Users can only add comments they authored"
4. **Hybrid**: "Moderators can add any comments, users only their own"

**Important:** postRelationship uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---

### patchRelationship - Replace Relationship

**Flow:**

```typescript
PATCH /posts/:id/relationships/:relName
↓
1. AclGuard checks: can('patchRelationship', 'Post')
2. ORM Proxy intercepts ormService.patchRelationship(id, relName, input)
3. Prepare ACL query with relationship include
4. Fetch entity with OLD relationship (getOne with ACL conditions + include)
5. If not found → 404 Not Found
6. Load NEW relationships being set (from input.data) via loadRelations
7. Create entityToCheck with __current support:
   - Root level = entity with NEW relationships
   - __current = entity with OLD relationships
8. Two-stage check with @input + field-level:
   - updateWithInput(entityToCheck) - materialize rules with NEW + OLD data
   - Check: can('patchRelationship', subject('Post', entityToCheck), relName)
9. If denied → 403 Forbidden
10. If allowed → execute replace
11. Return: void (successful replacement)
```

**⚠️ Important: `__current` Support**

Unlike postRelationship and deleteRelationship, **patchRelationship supports `__current`** (like patchOne):

```typescript
// Request: PATCH /users/5/relationships/aclComments
// body: { data: [{ type: 'comments', id: 30 }, { type: 'comments', id: 40 }] }

// Step 1: Fetch entity with OLD relationships
const oldEntity = {
  id: 5,
  aclComments: [{ id: 10, authorId: 5 }, { id: 20, authorId: 5 }]  // OLD
};

// Step 2: Load NEW relationships from input
const newRelationships = [
  { id: 30, authorId: 5 },
  { id: 40, authorId: 10 }
]; // NEW

// Step 3: Create entityToCheck with __current
const entityToCheck = {
  id: 5,
  aclComments: [{ id: 30, ... }, { id: 40, ... }],  // NEW relationships at root
  __current: {
    id: 5,
    aclComments: [{ id: 10, ... }, { id: 20, ... }]  // OLD entity with OLD relationships
  }
};

// Step 4: Check rules - can access BOTH old and new values
can('patchRelationship', subject('UsersAcl', entityToCheck), 'aclComments');
// Rules can use:
// - ${@input.aclComments.map(i => i.id)} → [30, 40] (NEW values)
// - ${@input.__current.aclComments.map(i => i.id)} → [10, 20] (OLD values)
```

This enables rules like: "Can only replace relationships if not removing any items"

**Three ACL Scenarios:**

**1. No conditions, no field restrictions (admin)**

```typescript
// Rule:
{
  action: 'patchRelationship',
  subject: 'UsersAcl',
  // No conditions = can replace any user's relationships
  // No fields = can replace all relationships
}

// Result: Can replace any relationship for any user
// PATCH /users-acl/1/relationships/aclComments → ✅ Success (200)
// PATCH /users-acl/1/relationships/posts → ✅ Success (200)
// PATCH /users-acl/2/relationships/aclComments → ✅ Success (200)
```

**2. No conditions, with field restrictions (moderator)**

```typescript
// Rule:
{
  action: 'patchRelationship',
  subject: 'UsersAcl',
  fields: ['posts'],  // Only 'posts' relationship allowed
}

// Scenario A: Replace allowed relationship
// PATCH /users-acl/1/relationships/posts
// body: { data: [{ type: 'posts', id: 5 }, { type: 'posts', id: 7 }] }
// → Fetch user with OLD posts: { id: 1, posts: [{ id: 2, ... }, { id: 3, ... }] }
// → Load NEW posts: [{ id: 5, ... }, { id: 7, ... }]
// → Create entityToCheck with __current
// → updateWithInput(entityToCheck) → Check: can('patchRelationship', user, 'posts')
// → ✅ 'posts' in fields → Success (200)

// Scenario B: Replace forbidden relationship
// PATCH /users-acl/1/relationships/aclComments
// body: { data: [{ type: 'comments', id: 10 }] }
// → Fetch user with OLD aclComments → Load NEW comment → Create entityToCheck
// → updateWithInput(entityToCheck) → Check: can('patchRelationship', user, 'aclComments')
// → ❌ 'aclComments' NOT in fields → 403 Forbidden
// {
//   "errors": [{
//     "code": "forbidden",
//     "message": "not allow \"patchRelationship\"",
//     "path": ["action"]
//   }]
// }
```

**3. With conditions + field restrictions (user)**

```typescript
// Rule: Can only replace own aclComments
{
  action: 'patchRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}'  // Must be own user
  },
  fields: ['aclComments']  // Only this relationship
}

// Scenario A: Replace own aclComments
// PATCH /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 30 }, { type: 'comments', id: 40 }] }
// → Database query: WHERE id = 5 AND id = 5 (conditions match)
// → Fetch user with OLD aclComments: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
// → Load NEW aclComments: [{ id: 30, ... }, { id: 40, ... }]
// → Create entityToCheck: {
//     id: 5,
//     aclComments: [{ id: 30, ... }, { id: 40, ... }],
//     __current: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
//   }
// → updateWithInput(entityToCheck)
// → Check: can('patchRelationship', user, 'aclComments')
// → ✅ conditions match + 'aclComments' in fields → Success (200)

// Scenario B: Try to replace someone else's aclComments
// PATCH /users-acl/10/relationships/aclComments (currentUser.id = 5)
// body: { data: [{ type: 'comments', id: 30 }] }
// → Database query: WHERE id = 10 AND id = 5 (conditions don't match)
// → Entity not found (filtered by ACL conditions)
// → ❌ 403 Forbidden

// Scenario C: Try to replace forbidden relationship
// PATCH /users-acl/5/relationships/posts (currentUser.id = 5)
// body: { data: [{ type: 'posts', id: 7 }] }
// → Fetch user → Load posts → Create entityToCheck
// → Check: can('patchRelationship', user, 'posts')
// → ❌ 'posts' NOT in fields → 403 Forbidden
```

**Advanced: Using `__current` to compare old vs new**

The `__current` magic enables powerful rules based on comparing old and new relationship values:

```typescript
// Rule: User can ONLY add new items to aclComments, cannot remove existing ones
{
  action: 'patchRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}',
    'aclComments': {
      // NEW comments must include ALL old comment IDs
      $all: '${@input.__current.aclComments.map(i => i.id)}'
    }
  },
  fields: ['aclComments']
}

// Scenario A: Add new comments (keeping all old ones) ✅
// PATCH /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [
//   { type: 'comments', id: 10 },  // OLD
//   { type: 'comments', id: 20 },  // OLD
//   { type: 'comments', id: 30 },  // NEW
//   { type: 'comments', id: 40 }   // NEW
// ]}
// → OLD: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
// → NEW: [{ id: 10, ... }, { id: 20, ... }, { id: 30, ... }, { id: 40, ... }]
// → entityToCheck: {
//     id: 5,
//     aclComments: [{ id: 10 }, { id: 20 }, { id: 30 }, { id: 40 }],
//     __current: { id: 5, aclComments: [{ id: 10 }, { id: 20 }] }
//   }
// → Check: NEW comments [10, 20, 30, 40] include ALL old [10, 20] ✅
// → Success (200)

// Scenario B: Try to remove comment ❌
// PATCH /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [
//   { type: 'comments', id: 20 },  // Only keeping id: 20, removing id: 10
//   { type: 'comments', id: 30 }   // NEW
// ]}
// → OLD: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
// → NEW: [{ id: 20, ... }, { id: 30, ... }]
// → entityToCheck: {
//     id: 5,
//     aclComments: [{ id: 20 }, { id: 30 }],
//     __current: { id: 5, aclComments: [{ id: 10 }, { id: 20 }] }
//   }
// → Check: NEW comments [20, 30] do NOT include all old [10, 20] ❌
// → 403 Forbidden (missing id: 10)

// Scenario C: Replace completely (different items) ❌
// PATCH /users-acl/5/relationships/aclComments (currentUser.id = 5)
// body: { data: [
//   { type: 'comments', id: 30 },
//   { type: 'comments', id: 40 }
// ]}
// → OLD: { id: 5, aclComments: [{ id: 10, ... }, { id: 20, ... }] }
// → NEW: [{ id: 30, ... }, { id: 40, ... }]
// → Check: NEW [30, 40] do NOT include old [10, 20] ❌
// → 403 Forbidden
```

**Another example: Only allow removing your own comments**

```typescript
// Rule: Can replace aclComments, but removed items must be authored by current user
{
  action: 'patchRelationship',
  subject: 'UsersAcl',
  conditions: {
    id: '${currentUser.id}',
    // Items in OLD but not in NEW must have authorId = currentUser.id
    '__current.aclComments': {
      $all: {
        $or: [
          // Either: item is kept (exists in NEW)
          { id: { $in: '${@input.aclComments.map(i => i.id)}' } },
          // Or: item is removed but authored by current user
          { authorId: '${currentUser.id}' }
        ]
      }
    }
  },
  fields: ['aclComments']
}
```

**Key Points:**

- ✅ **Two-stage check**: Entity-level (fetch with conditions) + field-level (relationship name)
- ✅ **@input support**: Can use `${@input.field}` in conditions (entity + new relationships available)
- ✅ **`__current` support**: Can use `${@input.__current.*}` to access old relationship values
- ✅ **Loaded relationships**: New relationships loaded via `loadRelations` before ACL check
- ✅ **Field = Relationship name**: `fields` array contains allowed relationship names
- ✅ **Compare old vs new**: `__current` enables comparing what relationships were vs will be
- ✅ **Helper functions**: Can use helper functions from `AclRulesLoader.getHelpers()` to process old/new values
- ⚠️ **To-many vs to-one**: Works for both relationship types

**How `__current` works:**

```typescript
// Structure of entityToCheck:
{
  ...oldEntity,                    // Entity properties
  [relName]: newRelationships,     // NEW relationships at root level
  __current: oldEntity             // Complete OLD entity with OLD relationships
}

// Example with to-many relationship:
{
  id: 5,
  name: 'Alice',
  aclComments: [{ id: 30, ... }, { id: 40, ... }],  // NEW - what will be after patch
  __current: {
    id: 5,
    name: 'Alice',
    aclComments: [{ id: 10, ... }, { id: 20, ... }]  // OLD - what was before patch
  }
}

// Rules can access:
// - ${@input.aclComments.map(i => i.id)} → [30, 40] (NEW values)
// - ${@input.__current.aclComments.map(i => i.id)} → [10, 20] (OLD values)
// - Compare, calculate diff, check if items removed/added, etc.
```

**404 Not Found vs 403 Forbidden:**

```typescript
// Scenario 1: Entity doesn't exist
PATCH /posts/99999/relationships/comments
→ 404 Not Found (entity not found)

// Scenario 2: Entity exists but ACL conditions deny access
PATCH /posts/5/relationships/comments (conditions don't match)
→ 403 Forbidden (filtered by ACL conditions)

// Scenario 3: Entity exists, conditions match, but relationship not allowed
PATCH /posts/5/relationships/comments (entity accessible, but 'comments' not in fields)
→ 403 Forbidden (relationship not in fields list)

// Scenario 4: Entity exists, relationship allowed, but __current conditions fail
PATCH /posts/5/relationships/comments (trying to remove items not authored by user)
→ 403 Forbidden (__current validation failed)

// Why 403 instead of 404?
// - Consistent with other relationship methods
// - Don't leak information about resource existence
```

**Use cases:**

1. **Simple field restriction**: "Users can only replace posts relationships, not comments"
2. **Owner-only replacement**: "Users can only replace relationships on their own entities"
3. **Add-only replacement**: "Users can add new items but cannot remove existing ones"
4. **Conditional removal**: "Users can remove only items they authored"
5. **Hybrid**: "Moderators can replace freely, users can only add to their own"
6. **Complex validation**: "Can replace if new list size >= old list size" (using helper functions)

**Important:** patchRelationship uses the same error handling as getAll:
- Invalid ACL rules → Production: 403, Development: 500
- Same recommendations apply (test rules, use simple conditions, monitor logs)

---
