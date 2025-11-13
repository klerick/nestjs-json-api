<h1 align="center">Smart Tools for NestJS</h1>

<p align="center">
  A comprehensive monorepo of <strong>NestJS</strong> libraries for building standardized APIs with <strong>JSON:API</strong> and <strong>JSON-RPC 2.0</strong> specifications, with fine-grained access control and resource permissions.
</p>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Packages](#-packages)
  - [JSON:API](#1-jsonapi)
  - [JSON-RPC](#2-json-rpc)
  - [Access Control (ACL)](#3-access-control-acl)
- [Quick Start](#-quick-start)
  - [Installation](#installation)
  - [Running Demo Applications](#running-demo-applications)
- [License](#-license)

---

## 🎯 Overview

This monorepo provides a complete set of tools to simplify the development of server and client applications using **NestJS**. It includes support for two popular API protocols and a powerful access control system:

**API Protocols:**
- **[JSON:API](https://jsonapi.org/)** – Build RESTful APIs with standardized request/response formats
- **[JSON-RPC 2.0](https://www.jsonrpc.org/)** – Implement remote procedure calls using JSON

**Access Control:**
- **[CASL](https://casl.js.org/)** – Fine-grained access control with full integration for JSON:API resources

All packages are designed to work seamlessly with modern ORMs like **TypeORM** and **MikroORM**, and include built-in support for [PGlite](https://github.com/electric-sql/pglite) for local development.

---

## 📋 Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **yarn**

---

## 📦 Packages

### 1. JSON:API

Build production-ready **JSON:API** compliant REST APIs with automatic CRUD generation, filtering, sorting, pagination, and relationship handling.

<table>
<tr>
<th>Package</th>
<th>Description</th>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs">json-api-nestjs</a></strong>
</td>
<td>
Core library for creating JSON:API compliant servers. Automatically generates endpoints for CRUD operations, relationships, filtering, sorting, pagination, and atomic operations. Supports TypeORM and MikroORM adapters.
</td>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs-typeorm">json-api-nestjs-typeorm</a></strong>
</td>
<td>
TypeORM adapter for json-api-nestjs. Enables JSON:API functionality with TypeORM entities, migrations, and repositories.
</td>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs-microorm">json-api-nestjs-microorm</a></strong>
</td>
<td>
MikroORM adapter for json-api-nestjs. Provides JSON:API support with MikroORM entities, migrations, and advanced query features.
</td>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs-sdk">json-api-nestjs-sdk</a></strong>
</td>
<td>
Type-safe client SDK for consuming JSON:API endpoints. Works with Axios, Fetch API, and Angular HttpClient. Supports filtering, sorting, includes, atomic operations, and provides full TypeScript type inference.
</td>
</tr>
</table>

---

### 2. JSON-RPC

Implement **JSON-RPC 2.0** servers and clients with support for HTTP and WebSocket transports, batch requests, and automatic method discovery.

<table>
<tr>
<th>Package</th>
<th>Description</th>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-rpc/nestjs-json-rpc">nestjs-json-rpc</a></strong>
</td>
<td>
JSON-RPC 2.0 server implementation for NestJS. Supports HTTP and WebSocket transports, batch requests, custom error handling, and automatic method registration via decorators.
</td>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/json-rpc/nestjs-json-rpc-sdk">nestjs-json-rpc-sdk</a></strong>
</td>
<td>
Type-safe JSON-RPC client SDK with automatic method inference, batch request support, and WebSocket/HTTP transport options.
</td>
</tr>
</table>

---

### 3. Access Control (ACL)

Add fine-grained **Access Control Lists** to your JSON:API endpoints using **[CASL](https://casl.js.org/)** with template-based rule materialization.

<table>
<tr>
<th>Package</th>
<th>Description</th>
</tr>

<tr>
<td>
<strong><a href="https://github.com/klerick/nestjs-json-api/tree/master/libs/acl-permissions/nestjs-acl-permissions">nestjs-acl-permissions</a></strong>
</td>
<td>
Type-safe ACL module with CASL integration for JSON:API endpoints. Features template interpolation, field-level permissions, context-based rules, lazy evaluation, and transparent ORM-level filtering. Can be used standalone or with automatic integration via <code>json-api-nestjs</code>.
</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation

This monorepo uses [Nx](https://nx.dev/) and supports **TypeORM** and **MikroORM** with [PGlite](https://github.com/electric-sql/pglite) for local development.

```bash
# Install dependencies
npm install
```

#### Setup TypeORM Database

```bash
# Initialize database and run migrations
npm run typeorm:up:remove  # Removes existing DB and runs migrations

# Or just run migrations (if DB exists)
npm run typeorm:up

# Seed the database
npm run typeorm:seeder
```

#### Setup MikroORM Database

```bash
# Initialize database and run migrations
npm run microorm:up:remove  # Removes existing DB and runs migrations

# Or just run migrations (if DB exists)
npm run microorm:up

# Seed the database
npm run microorm:seeder
```

---

### Running Demo Applications

#### JSON:API Server (TypeORM)

```bash
# Using npm script
npm run demo:json-api

# Or using nx directly
nx run json-api-server:serve-typeorm
```

Server will start on `http://localhost:3000` (or configured port)

Available endpoints:
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/relationships/:rel` - Get relationships
- And more...

#### JSON:API Server (MikroORM)

```bash
# Using nx
nx run json-api-server:serve-microorm
```

---

## 🌟 Features

- **Automatic CRUD Generation** – Generate complete REST APIs from ORM entities
- **JSON:API Compliant** – Full specification support including relationships, filtering, sorting, pagination, sparse fieldsets
- **Atomic Operations** – Perform multiple operations in a single request
- **Type Safety** – Full TypeScript support with type inference
- **Multiple ORMs** – Support for TypeORM and MikroORM
- **JSON-RPC 2.0** – Implement RPC servers with HTTP/WebSocket transports
- **Access Control** – Fine-grained permissions with CASL integration
- **Swagger/OpenAPI** – Automatic API documentation generation
- **Extensible** – Override default controllers and services

---

## 📖 Documentation

Each package has detailed documentation in its own README:

- [json-api-nestjs](libs/json-api/json-api-nestjs/README.md)
- [json-api-nestjs-typeorm](libs/json-api/json-api-nestjs-typeorm/README.md)
- [json-api-nestjs-microorm](libs/json-api/json-api-nestjs-microorm/README.md)
- [json-api-nestjs-sdk](libs/json-api/json-api-nestjs-sdk/README.md)
- [nestjs-json-rpc](libs/json-rpc/nestjs-json-rpc/README.md)
- [nestjs-json-rpc-sdk](libs/json-rpc/nestjs-json-rpc-sdk/README.md)
- [nestjs-acl-permissions](libs/acl-permissions/nestjs-acl-permissions/README.md)

---

## 📘 Examples & Usage

For detailed usage examples and real-world scenarios, refer to the comprehensive **E2E test suites**. These tests serve as living documentation and demonstrate best practices:

### JSON:API SDK Examples
Learn how to use the JSON:API client SDK with various operations:

- **[GET Operations](apps/json-api-server-e2e/src/json-api/json-api-sdk/get-method.spec.ts)** – Fetching resources, filtering, pagination, sparse fieldsets, and relationships
- **[POST Operations](apps/json-api-server-e2e/src/json-api/json-api-sdk/post-method.spec.ts)** – Creating resources with relationships
- **[PATCH Operations](apps/json-api-server-e2e/src/json-api/json-api-sdk/patch-methode.spec.ts)** – Updating resources and relationships
- **[Atomic Operations](apps/json-api-server-e2e/src/json-api/json-api-sdk/atomic-sdk.spec.ts)** – Batch requests with multiple operations
- **[Advanced Configuration](apps/json-api-server-e2e/src/json-api/json-api-sdk/check-othe-call.spec.ts)** – Custom routes, UUID IDs, validation pipes
- **[Common Decorators](apps/json-api-server-e2e/src/json-api/json-api-sdk/check-common-decorator.spec.ts)** – Guards, interceptors, and exception filters

### JSON-RPC Examples
Explore JSON-RPC 2.0 client usage patterns:

- **[HTTP Transport](apps/json-api-server-e2e/src/json-api/json-rpc/run-json-rpc.spec.ts)** – Single and batch RPC calls over HTTP, error handling
- **[WebSocket Transport](apps/json-api-server-e2e/src/json-api/json-rpc/run-ws-json-rpc.spec.ts)** – Real-time RPC over WebSocket connections

### Access Control (ACL) Examples
Understand fine-grained permission enforcement with CASL integration:

- **[GET All Resources](apps/json-api-server-e2e/src/json-api/json-acl/1-get-all-acl-check.spec.ts)** – Field-level and row-level filtering
- **[GET One Resource](apps/json-api-server-e2e/src/json-api/json-acl/2-get-one-acl-check.spec.ts)** – Resource-level access control
- **[GET Relationships](apps/json-api-server-e2e/src/json-api/json-acl/3-get-relationship-acl-check.spec.ts)** – Relationship endpoint permissions
- **[PATCH Operations](apps/json-api-server-e2e/src/json-api/json-acl/4-patch-one-acl-check.spec.ts)** – Update permissions with field and value restrictions
- **[POST Operations](apps/json-api-server-e2e/src/json-api/json-acl/5-post-one-acl-check.spec.ts)** – Create permissions with conditional validation
- **[DELETE Operations](apps/json-api-server-e2e/src/json-api/json-acl/6-delete-one-acl-check.spec.ts)** – Conditional delete based on resource state
- **[Atomic Operations ACL](apps/json-api-server-e2e/src/json-api/json-acl/10-atomic-operation.spec.ts)** – ACL enforcement across batch requests

Each test file includes detailed JSDoc comments explaining the scenarios, ACL rules, and expected behavior.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is [MIT licensed](LICENSE).

---

<p align="center">Made with ❤️ by <a href="https://github.com/klerick">Aleksandr Kharkovey</a></p>
