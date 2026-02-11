<p align='center'>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/v/@klerick/json-api-nestjs-sdk.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/l/@klerick/json-api-nestjs-sdk.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@klerick/json-api-nestjs-sdk" target="_blank"><img src="https://img.shields.io/npm/dm/json-api-nestjs-sdk.svg" alt="NPM Downloads" /></a>
  <a href="http://commitizen.github.io/cz-cli/" target="_blank"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly" /></a>
  <img src="https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/klerick/02a4c98cf7008fea2af70dc2d50f4cb7/raw/json-api-nestjs-sdk.json" alt="Coverage Badge" />
</p>

# JSON:API Client SDK

Type-safe TypeScript/JavaScript client for consuming [JSON:API](https://jsonapi.org/) endpoints built with [@klerick/json-api-nestjs](https://www.npmjs.com/package/@klerick/json-api-nestjs).

## ✨ Features

- 🎯 **Full Type Safety** - Complete TypeScript support with type inference from your entities
- 🔍 **Advanced Filtering** - Rich query builder with operators (eq, ne, in, like, gt, lt, etc.)
- 📦 **Relationship Handling** - Easy include, sparse fieldsets, and relationship management
- ⚡ **Atomic Operations** - Batch multiple operations in a single request with rollback support
- 🌐 **Multiple HTTP Clients** - Works with Axios, Fetch API, and Angular HttpClient
- 📄 **Pagination & Sorting** - Built-in support for pagination and multi-field sorting
- 🔄 **Observable or Promise** - Choose your async style (RxJS Observable or native Promise)
- 🔗 **Relationship Operations** - Post, patch, and delete relationships independently

## 📚 Table of Contents

- [Installation](#installation)
- [Quick Start](#-quick-start)
  - [Basic Setup (Axios)](#basic-setup-axios)
  - [Angular Setup](#angular-setup)
- [Configuration](#-configuration)
- [API Methods](#-api-methods)
  - [Fetching Resources](#fetching-resources)
  - [Creating Resources](#creating-resources)
  - [Updating Resources](#updating-resources)
  - [Deleting Resources](#deleting-resources)
  - [Relationship Operations](#relationship-operations)
- [Working with Plain Objects](#-working-with-plain-objects)
  - [Using entity() Method](#using-entity-method)
  - [Using String Type Names](#using-string-type-names)
- [Nullifying Relationships](#-nullifying-relationships)
- [Clearing To-Many Relationships](#-clearing-to-many-relationships)
- [Query Options](#-query-options)
  - [Filtering](#filtering)
  - [Sorting](#sorting)
  - [Pagination](#pagination)
  - [Including Relationships](#including-relationships)
  - [Sparse Fieldsets](#sparse-fieldsets)
- [Atomic Operations](#-atomic-operations)
- [Examples](#-examples)


## Installation

```bash
npm install @klerick/json-api-nestjs-sdk
```

---

## 🚀 Quick Start

### Basic Setup (Axios)

```typescript
import { JsonApiJs, adapterForAxios, FilterOperand } from '@klerick/json-api-nestjs-sdk';
import axios from 'axios';
import { Users } from './entities'; // Your entity classes

// 1. Create adapter
const axiosAdapter = adapterForAxios(axios);

// 2. Configure SDK
const jsonSdk = JsonApiJs(
  {
    adapter: axiosAdapter,
    apiHost: 'http://localhost:3000',
    apiPrefix: 'api',
    dateFields: ['createdAt', 'updatedAt'],
    operationUrl: 'operation',
  },
  true // true = return Promises, false = return Observables
);

// 3. Use SDK
// Fetch all users
const users = await jsonSdk.jsonApiSdkService.getAll(Users);

// Fetch with filtering and relationships
const activeUsers = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      isActive: { [FilterOperand.eq]: 'true' }
    }
  },
  include: ['addresses', 'roles']
});

// Get one user
const user = await jsonSdk.jsonApiSdkService.getOne(Users, '1', {
  include: ['addresses', 'comments', 'roles', 'manager']
});

// Create a user
const newUser = new Users();
newUser.firstName = 'John';
newUser.lastName = 'Doe';
newUser.login = 'johndoe';
newUser.isActive = true;

const createdUser = await jsonSdk.jsonApiSdkService.postOne(newUser);

// Update a user
createdUser.firstName = 'Jane';
const updatedUser = await jsonSdk.jsonApiSdkService.patchOne(createdUser);

// Delete a user
await jsonSdk.jsonApiSdkService.deleteOne(createdUser);
```

### Angular Setup

```typescript
import {
  provideJsonApi,
  AtomicFactory,
  JsonApiSdkService
} from '@klerick/json-api-nestjs-sdk/ngModule';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

// 1. Configure in your main.ts or app.config.ts

// Option A: Direct configuration object
const angularConfig = {
  apiHost: 'http://localhost:3000',
  idKey: 'id',
  apiPrefix: 'api',
  operationUrl: 'operation',
  dateFields: ['createdAt', 'updatedAt']
};

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideJsonApi(angularConfig)
  ],
}).catch((err) => console.error(err));

// Option B: Factory function (useful for dynamic configuration)
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideJsonApi(() => {
      const env = inject(EnvironmentService);
      return {
        apiHost: env.apiUrl,
        idKey: 'id',
        apiPrefix: 'api',
        operationUrl: 'operation',
        dateFields: ['createdAt', 'updatedAt']
      };
    })
  ],
}).catch((err) => console.error(err));

// 2. Use in your components
@Component({
  standalone: true,
  selector: 'app-users',
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private jsonApiService = inject(JsonApiSdkService);
  private atomicFactory = inject(AtomicFactory);

  async loadUsers() {
    const users = await this.jsonApiService.getAll(Users, {
      include: ['addresses']
    });
    return users;
  }

  async createMultipleResources() {
    const result = await this.atomicFactory()
      .postOne(newUser)
      .postOne(newAddress)
      .run();
  }
}
```

## ⚙️ Configuration

### JsonConfig Type

```typescript
type JsonSdkConfig = {
  apiHost: string;          // Base URL of your API (e.g., 'http://localhost:3000')
  apiPrefix?: string;       // API prefix (e.g., 'api' -> '/api/users')
  idKey?: string;           // Name of ID field (default: 'id')
  idIsNumber?: boolean;     // Parse IDs as numbers (default: false)
  operationUrl?: string;    // URL path for atomic operations (default: 'operation')
  dateFields?: string[];    // Fields to convert to Date objects (e.g., ['createdAt', 'updatedAt'])
}

type JsonConfig = JsonSdkConfig & {
  adapter?: HttpInnerClient; // HTTP client adapter (default: fetch)
}

// Angular: provideJsonApi accepts config or factory function
type JsonSdkConfigFactory = () => JsonSdkConfig;
type JsonSdkConfigOrFactory = JsonSdkConfig | JsonSdkConfigFactory;
```

### HTTP Adapters

**Axios Adapter:**
```typescript
import { adapterForAxios } from '@klerick/json-api-nestjs-sdk';
import axios from 'axios';

const adapter = adapterForAxios(axios);
```

**Fetch API (default):**
```typescript
// No adapter needed, fetch is used by default
const jsonSdk = JsonApiJs({
  apiHost: 'http://localhost:3000',
  apiPrefix: 'api',
}, true);
```

**Custom Adapter:**

See [HttpInnerClient interface](https://github.com/klerick/nestjs-json-api/blob/master/libs/json-api/json-api-nestjs-sdk/src/lib/types/http-inner-client.ts) for implementation details.

---

## 📖 API Methods

### Fetching Resources

#### `getAll(Entity, options?)`

Fetch all resources with optional filtering, sorting, and relationships.

```typescript
import { FilterOperand } from '@klerick/json-api-nestjs-sdk';

// Fetch all users
const users = await jsonSdk.jsonApiSdkService.getAll(Users);

// With filtering
const activeUsers = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      isActive: { [FilterOperand.eq]: 'true' },
      id: { [FilterOperand.in]: ['1', '2', '3'] }
    }
  },
  include: ['addresses', 'roles']
});

// Filter by relationship
const usersWithRoles = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      id: { [FilterOperand.in]: ['1', '2'] }
    },
    roles: {
      name: { [FilterOperand.eq]: 'admin' }
    }
  },
  include: ['roles']
});
```

#### `getList(Entity, options)`

Fetch resources with pagination (returns paginated results).

```typescript
const firstPage = await jsonSdk.jsonApiSdkService.getList(Users, {
  page: {
    number: 1,
    size: 10
  },
  sort: {
    target: {
      id: 'ASC'
    }
  }
});

const secondPage = await jsonSdk.jsonApiSdkService.getList(Users, {
  page: {
    number: 2,
    size: 10
  },
  sort: {
    target: {
      createdAt: 'DESC'
    }
  }
});
```

#### `getOne(Entity, id, options?)`

Fetch a single resource by ID.

```typescript
// Simple fetch
const user = await jsonSdk.jsonApiSdkService.getOne(Users, '1');

// With relationships
const userWithRelations = await jsonSdk.jsonApiSdkService.getOne(Users, '1', {
  include: ['addresses', 'comments', 'roles', 'manager']
});

// With sparse fieldsets
const userPartial = await jsonSdk.jsonApiSdkService.getOne(Users, '1', {
  fields: {
    users: ['firstName', 'lastName', 'email']
  }
});
```

### Creating Resources

#### `postOne(entity, options?)`

Create a new resource.

```typescript
// Simple create
const newUser = new Users();
newUser.firstName = 'John';
newUser.lastName = 'Doe';
newUser.login = 'johndoe';
newUser.isActive = true;

const createdUser = await jsonSdk.jsonApiSdkService.postOne(newUser);

// Create with client-generated ID
// Note: Server must have `allowSetId: true` option enabled
const userWithId = new Users();
userWithId.id = 'my-custom-uuid';
userWithId.firstName = 'Jane';
userWithId.lastName = 'Doe';
userWithId.login = 'janedoe';

const createdUserWithId = await jsonSdk.jsonApiSdkService.postOne(userWithId);

// Create with relationships
const newAddress = new Addresses();
newAddress.city = 'New York';
newAddress.state = 'NY';
newAddress.country = 'USA';

const savedAddress = await jsonSdk.jsonApiSdkService.postOne(newAddress);

const user = new Users();
user.firstName = 'Jane';
user.lastName = 'Doe';
user.login = 'janedoe';
user.addresses = savedAddress; // Set relationship

const createdUser = await jsonSdk.jsonApiSdkService.postOne(user);
```

### Updating Resources

#### `patchOne(entity, options?)`

Update an existing resource.

```typescript
// Update attributes
user.firstName = 'Updated Name';
const updatedUser = await jsonSdk.jsonApiSdkService.patchOne(user);

// Update relationships
const newAddress = await jsonSdk.jsonApiSdkService.postOne(addressEntity);
user.addresses = newAddress;

const updatedUser = await jsonSdk.jsonApiSdkService.patchOne(user);
```

### Deleting Resources

#### `deleteOne(entity)`

Delete a resource.

```typescript
await jsonSdk.jsonApiSdkService.deleteOne(user);
```

### Relationship Operations

#### `deleteRelationships(entity, relationshipName)`

Remove relationships without deleting the related resources.

```typescript
// Remove all roles from user
await jsonSdk.jsonApiSdkService.deleteRelationships(user, 'roles');

// Remove manager from user
await jsonSdk.jsonApiSdkService.deleteRelationships(user, 'manager');

// Remove all comments from user
await jsonSdk.jsonApiSdkService.deleteRelationships(user, 'comments');
```

---

## 🏗️ Working with Plain Objects

In monorepo environments or when sharing types between frontend and backend, you may want to use plain TypeScript types/interfaces instead of classes. The SDK provides tools to work with plain objects while maintaining full type safety.

### Using entity() Method

The `entity()` method creates a properly typed entity instance from a plain object. This is essential when:
- You share types (not classes) between frontend and backend
- The SDK needs to identify the resource type at runtime (via `constructor.name`)

```typescript
import { JsonApiJs } from '@klerick/json-api-nestjs-sdk';

// Shared type (not a class)
interface User {
  id?: number;
  firstName: string;
  lastName: string;
  login: string;
  manager?: User | null;
}

const jsonSdk = JsonApiJs({ apiHost: 'http://localhost:3000', apiPrefix: 'api' }, true);

// Create entity from plain object - chainable API
const createdUser = await jsonSdk.jsonApiSdkService
  .entity<User>('Users', {
    firstName: 'John',
    lastName: 'Doe',
    login: 'johndoe'
  })
  .postOne();

// Update entity - chainable API
const updatedUser = await jsonSdk.jsonApiSdkService
  .entity<User>('Users', {
    id: 1,
    firstName: 'Jane'
  })
  .patchOne();

// Delete entity - chainable API
await jsonSdk.jsonApiSdkService
  .entity<User>('Users', { id: 1 })
  .deleteOne();

// Work with relationships
const userRelations = await jsonSdk.jsonApiSdkService
  .entity<User>('Users', { id: 1 })
  .getRelationships('manager');
```

**Raw mode** - get the entity instance without chaining:

```typescript
// Get raw entity instance (third argument = true)
const userEntity = jsonSdk.jsonApiSdkService.entity<User>('Users', {
  firstName: 'John',
  lastName: 'Doe',
  login: 'johndoe'
}, true);

// Now use it with standard SDK methods
const created = await jsonSdk.jsonApiSdkService.postOne(userEntity);
```

### Using String Type Names

GET methods also accept string type names instead of classes:

```typescript
// Using string type name
const users = await jsonSdk.jsonApiSdkService.getAll<User>('Users', {
  include: ['manager']
});

const user = await jsonSdk.jsonApiSdkService.getOne<User>('Users', '1', {
  include: ['manager']
});

const userList = await jsonSdk.jsonApiSdkService.getList<User>('Users', {
  page: { number: 1, size: 10 }
});
```

---

## 🔗 Nullifying Relationships

To clear a relationship (set it to `null`), use the `nullRef()` function. This is necessary because the SDK distinguishes between:
- **Missing relationship** - not included in the request (no change)
- **Null relationship** - explicitly set to `null` (clear the relationship)

```typescript
import { JsonApiJs, nullRef } from '@klerick/json-api-nestjs-sdk';

interface User {
  id?: number;
  firstName: string;
  manager?: User | null;
}

const jsonSdk = JsonApiJs({ apiHost: 'http://localhost:3000', apiPrefix: 'api' }, true);

// Clear the manager relationship
const user = jsonSdk.jsonApiSdkService.entity<User>('Users', {
  id: 1,
  firstName: 'John',
  manager: nullRef()  // This will send { data: null } for the relationship
}, true);

const updatedUser = await jsonSdk.jsonApiSdkService.patchOne(user);
// Result: user.manager is now null
```

**How it works:**
- `nullRef()` returns a special marker object that TypeScript sees as `null`
- At runtime, the SDK detects this marker and generates `{ data: null }` in the JSON:API request body
- The server then clears the relationship

**Without nullRef:**
```typescript
// This won't clear the relationship - it will be ignored
const user = jsonSdk.jsonApiSdkService.entity<User>('Users', {
  id: 1,
  firstName: 'John',
  // manager is undefined - not included in request
}, true);
```

**With nullRef:**
```typescript
// This explicitly clears the relationship
const user = jsonSdk.jsonApiSdkService.entity<User>('Users', {
  id: 1,
  firstName: 'John',
  manager: nullRef()  // Generates: relationships: { manager: { data: null } }
}, true);
```

## 🔗 Clearing To-Many Relationships

To clear all items from a to-many relationship (ManyToMany, OneToMany), use the `emptyArrayRef()` function:

```typescript
import { JsonApiJs, emptyArrayRef } from '@klerick/json-api-nestjs-sdk';

interface User {
  id?: number;
  firstName: string;
  roles?: Role[];
}

const jsonSdk = JsonApiJs({ apiHost: 'http://localhost:3000', apiPrefix: 'api' }, true);

// Clear all roles from user
const user = jsonSdk.jsonApiSdkService.entity<User>('Users', {
  id: 1,
  firstName: 'John',
  roles: emptyArrayRef()  // This will send { data: [] } for the relationship
}, true);

const updatedUser = await jsonSdk.jsonApiSdkService.patchOne(user);
// Result: user.roles is now an empty array
```

**Why emptyArrayRef is needed:**
- An empty array `[]` would be treated as an attribute (not a relationship)
- `emptyArrayRef()` marks it as a relationship that should be cleared
- At runtime, the SDK generates `{ data: [] }` in the JSON:API request body

**Comparison:**
```typescript
// ❌ This won't work - empty array treated as attribute
const user = { id: 1, roles: [] };

// ✅ This works - explicitly clears the relationship
const user = { id: 1, roles: emptyArrayRef() };
// Generates: relationships: { roles: { data: [] } }
```

---

## 🔍 Query Options

### Filtering

Available operators:

```typescript
enum FilterOperand {
  eq = 'eq',     // Equal
  ne = 'ne',     // Not equal
  in = 'in',     // In array
  nin = 'nin',   // Not in array
  lt = 'lt',     // Less than
  lte = 'lte',   // Less than or equal
  gt = 'gt',     // Greater than
  gte = 'gte',   // Greater than or equal
  like = 'like', // SQL LIKE
  re = 'regexp', // Regular expression
}
```

**Examples:**

```typescript
// Equal
const users = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      isActive: { [FilterOperand.eq]: 'true' }
    }
  }
});

// Not equal
const inactiveUsers = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      isActive: { [FilterOperand.ne]: 'true' }
    }
  }
});

// In array
const specificUsers = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      id: { [FilterOperand.in]: ['1', '2', '3'] }
    }
  }
});

// LIKE search
const searchUsers = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      login: { [FilterOperand.like]: 'john' }
    }
  }
});

// Check null/not null
const usersWithManager = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      manager: { [FilterOperand.ne]: null }
    }
  }
});

const usersWithoutManager = await jsonSdk.jsonApiSdkService.getAll(Users, {
  filter: {
    target: {
      manager: { [FilterOperand.eq]: null }
    }
  }
});
```

### Sorting

```typescript
// Sort by single field
const users = await jsonSdk.jsonApiSdkService.getList(Users, {
  sort: {
    target: {
      id: 'ASC'
    }
  }
});

// Sort by multiple fields
const sortedUsers = await jsonSdk.jsonApiSdkService.getList(Users, {
  sort: {
    target: {
      createdAt: 'DESC',
      lastName: 'ASC'
    }
  }
});
```

### Pagination

```typescript
const paginatedUsers = await jsonSdk.jsonApiSdkService.getList(Users, {
  page: {
    number: 1,  // Page number (1-indexed)
    size: 20    // Items per page
  }
});
```

### Including Relationships

```typescript
// Include single relationship
const users = await jsonSdk.jsonApiSdkService.getAll(Users, {
  include: ['addresses']
});

// Include multiple relationships
const usersWithAll = await jsonSdk.jsonApiSdkService.getAll(Users, {
  include: ['addresses', 'roles', 'comments', 'manager']
});

// Include nested relationships
const usersWithNested = await jsonSdk.jsonApiSdkService.getAll(Users, {
  include: ['addresses', 'manager.addresses', 'roles']
});
```

### Sparse Fieldsets

Request only specific fields to reduce payload size.

```typescript
const users = await jsonSdk.jsonApiSdkService.getAll(Users, {
  fields: {
    users: ['firstName', 'lastName', 'email'],
    addresses: ['city', 'country']
  },
  include: ['addresses']
});
```

---

## ⚡ Atomic Operations

Execute multiple operations in a single HTTP request. All operations succeed or fail together.

### Basic Atomic Operation

```typescript
const newUser = new Users();
newUser.firstName = 'John';
newUser.lastName = 'Doe';
newUser.login = 'johndoe';

const result = await jsonSdk.atomicFactory()
  .postOne(newUser)
  .run();

console.log(result[0]); // Created user
```

### Multiple Operations

```typescript
// Create multiple related resources
const address = new Addresses();
address.city = 'New York';
address.state = 'NY';
address.country = 'USA';

const role = new Roles();
role.name = 'Admin';
role.key = 'admin';

const user = new Users();
user.firstName = 'Jane';
user.lastName = 'Doe';
user.login = 'janedoe';
user.addresses = address;
user.roles = [role];

const [createdAddress, createdRole, createdUser] = await jsonSdk
  .atomicFactory()
  .postOne(address)
  .postOne(role)
  .postOne(user)
  .run();
```

### Mixed Operations (POST, PATCH, Relationships)

```typescript
// Create user first
const newUser = new Users();
newUser.firstName = 'John';
newUser.login = 'john';

const [createdUser] = await jsonSdk.atomicFactory()
  .postOne(newUser)
  .run();

// Then update and manage relationships atomically
const patchUser = Object.assign(new Users(), createdUser);
patchUser.firstName = 'John Updated';
patchUser.roles = [role1];

const patchUser2 = Object.assign(new Users(), createdUser);
patchUser2.comments = [comment1];

const patchUser3 = Object.assign(new Users(), createdUser);
patchUser3.comments = [comment2];

const result = await jsonSdk
  .atomicFactory()
  .patchOne(patchUser)                        // Update user attributes and set roles
  .patchOne(patchUser2)                       // Set comments
  .patchRelationships(patchUser2, 'comments') // Replace comments (keep only comment1)
  .postRelationships(patchUser3, 'comments')  // Add comment2 to existing comments
  .run();

// result[0] - updated user
// result[1] - updated user with comments
// result[2] - array of comment IDs after replacement
// result[3] - array of all comment IDs after addition
```

### Using Local Identifiers (lid)

Create and reference resources within the same atomic request using local identifiers (`lid`). This allows you to establish relationships between resources being created in a single batch operation.

**How it works:**
1. Assign a temporary ID to the resource (any unique value - number or string)
2. Reference this ID in relationships of other resources in the same request
3. Server automatically replaces temporary IDs with real database IDs

**Example - Numeric lid:**
```typescript
const address = new Addresses();
address.city = 'Boston';
address.id = 10000; // Temporary ID (lid)

const user = new Users();
user.firstName = 'Alice';
user.addresses = address; // Reference resource by temporary ID

const [createdAddress, createdUser] = await jsonSdk
  .atomicFactory()
  .postOne(address)  // First operation: create address with lid=10000
  .postOne(user)     // Second operation: reference address via lid
  .run();

// Server assigns real IDs and maintains relationships
console.log(createdAddress.id); // Real ID (e.g., 42)
console.log(createdUser.addresses.id); // Same real ID (42)
```

**Example - UUID lid (for entities with UUID primary keys):**
```typescript
const book1 = new BookList();
book1.id = '550e8400-e29b-41d4-a716-446655440000'; // Temporary UUID (lid)
book1.title = 'TypeScript Handbook';

const book2 = new BookList();
book2.id = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Another temporary UUID (lid)
book2.title = 'Advanced Node.js';

const user = new Users();
user.firstName = 'John';
user.books = [book1, book2]; // Reference both books by their temporary UUIDs

const [createdBook1, createdBook2, createdUser] = await jsonSdk
  .atomicFactory()
  .postOne(book1)
  .postOne(book2)
  .postOne(user)
  .run();

// All temporary IDs are used as actual IDs (for UUID fields)
// or replaced with real IDs (for autoincrement fields)
console.log(createdBook1.id); // UUID from lid
console.log(createdBook2.id); // UUID from lid
console.log(createdUser.books.map(b => b.id)); // Both book UUIDs
```

**Important notes:**
- Local identifiers (lid) are only valid within a single atomic request
- The SDK automatically handles lid assignment in the request body
- For numeric IDs: lid is replaced with the actual database-generated ID
- For UUID IDs: lid can be used as the actual ID (if server has `allowSetId: true`)

---

## 💡 Examples

For comprehensive real-world examples, see the [E2E test suite](https://github.com/klerick/nestjs-json-api/tree/master/apps/json-api-server-e2e/src/json-api/json-api-sdk):

- **[GET Operations](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk/get-method.spec.ts)** - Fetching, filtering, pagination, sparse fieldsets
- **[POST Operations](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk/post-method.spec.ts)** - Creating resources with relationships
- **[PATCH Operations](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk/patch-methode.spec.ts)** - Updating resources and relationships
- **[Atomic Operations](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk/atomic-sdk.spec.ts)** - Batch requests with rollback
- **[Common Decorators](https://github.com/klerick/nestjs-json-api/blob/master/apps/json-api-server-e2e/src/json-api/json-api-sdk/check-common-decorator.spec.ts)** - Guards, interceptors, custom behavior

---

## 📝 License

MIT

---

## 🔗 Related Packages

- [@klerick/json-api-nestjs](https://www.npmjs.com/package/@klerick/json-api-nestjs) - JSON:API server implementation for NestJS
- [@klerick/json-api-nestjs-typeorm](https://www.npmjs.com/package/@klerick/json-api-nestjs-typeorm) - TypeORM adapter
- [@klerick/json-api-nestjs-microorm](https://www.npmjs.com/package/@klerick/json-api-nestjs-microorm) - MikroORM adapter
