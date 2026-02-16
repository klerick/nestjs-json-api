## 10.0.0-beta.18 (2026-02-16)

### 🚀 Features

- **json-api-nestjs:** add support for `meta` object in various operations ([3c09413](https://github.com/klerick/nestjs-json-api/commit/3c09413))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.17 (2026-02-11)

### 🩹 Fixes

- **json-api-nestjs:** replace `id` with `lid` in atomic operation references for JSON:API compliance ([579ed01](https://github.com/klerick/nestjs-json-api/commit/579ed01))
- **json-api-nestjs:** replace `tmpIds` with `lids` for improved clarity in atomic operation logic and related tests ([81e7da9](https://github.com/klerick/nestjs-json-api/commit/81e7da9))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.16 (2026-02-05)

### 🚀 Features

- **json-api-nestjs:** enhance Zod schema definitions with metadata, refactor Swagger integration, and improve reusability of schema registrations ([9ecb739](https://github.com/klerick/nestjs-json-api/commit/9ecb739))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.15 (2026-02-01)

### 🚀 Features

- **json-api-nestjs:** refactor query parameter schemas with Zod, improve Swagger definitions, and add reusable transformers ([70e955f](https://github.com/klerick/nestjs-json-api/commit/70e955f))
- **json-api-nestjs:** add primary key handling for relations and improve query schema generation ([7caea1a](https://github.com/klerick/nestjs-json-api/commit/7caea1a))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.7

### ❤️ Thank You

- Alex H

## 10.0.0-beta.14 (2026-01-23)

### 🚀 Features

- **json-api-nestjs-shared,json-api-nestjs:** im did mistake in commit msg ([56c483a](https://github.com/klerick/nestjs-json-api/commit/56c483a))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.6

### ❤️ Thank You

- Alex H

## 10.0.0-beta.13 (2026-01-23)

This was a version bump only for json-api-nestjs to align it with other projects, there were no code changes.

## 10.0.0-beta.12 (2026-01-23)

### 🚀 Features

- **json-api-nestjs:** enhance ZodIncludeQuery with improved type definitions and utility functions ([c4a5856](https://github.com/klerick/nestjs-json-api/commit/c4a5856))
- **json-api-nestjs:** add JsonApiResponseFrom decorator for reusing response schemas across methods ([f1f49c1](https://github.com/klerick/nestjs-json-api/commit/f1f49c1))
- **json-api-nestjs:** replace `errorSchema` with `JsonApiErrorResponseModel`, update response schema handling across Swagger methods ([4e7f481](https://github.com/klerick/nestjs-json-api/commit/4e7f481))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.5

### ❤️ Thank You

- Alex H

## 10.0.0-beta.11 (2026-01-22)

### 🚀 Features

- **json-api-nestjs:** add support for excluding controllers during module initialization ([5e2de06](https://github.com/klerick/nestjs-json-api/commit/5e2de06))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.10 (2026-01-21)

### 🚀 Features

- **json-api-nestjs:** optimize and memoize Zod schema generation ([611da19](https://github.com/klerick/nestjs-json-api/commit/611da19))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.9 (2026-01-20)

### 🚀 Features

- **json-api-nestjs:** enhance Patch and Post schema handling, add utility for merging patch data and refine type definitions for attributes and relationships ([2887603](https://github.com/klerick/nestjs-json-api/commit/2887603))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.8 (2026-01-19)

### 🚀 Features

- **json-api-nestjs:** add read-only and immutable field decorators with validation schema updates and inheritance support ([fccf757](https://github.com/klerick/nestjs-json-api/commit/fccf757))
- **json-api-nestjs,json-api-nestjs-microorm,json-api-nestjs-typeorm:** add support for automatic resource linkage in to-one relations, update FK field detection and handling ([0dd670d](https://github.com/klerick/nestjs-json-api/commit/0dd670d))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.7 (2025-12-26)

This was a version bump only for json-api-nestjs to align it with other projects, there were no code changes.

## 10.0.0-beta.6 (2025-11-13)

### 🚀 Features

- **json-api-nestjs:** add hooks support and enhance guards handling with `afterCreateController` hook and guards logic - prepare for acl libs ([5059530](https://github.com/klerick/nestjs-json-api/commit/5059530))
- **json-api-nestjs:** add `allowSetId` option for enhanced control over entity ID assignment during POST operations ([ce269ad](https://github.com/klerick/nestjs-json-api/commit/ce269ad))
- **json-api-nestjs:** fix after update nx ([e51f07c](https://github.com/klerick/nestjs-json-api/commit/e51f07c))
- **json-api-nestjs:** bump zod to v4 ([19888e9](https://github.com/klerick/nestjs-json-api/commit/19888e9))
- **json-api-nestjs:** Add JSON_API_DECORATOR_ENTITY metadata to controller ([d2deb39](https://github.com/klerick/nestjs-json-api/commit/d2deb39))
- **json-api-nestjs:** fix after update nx ([5d87f95](https://github.com/klerick/nestjs-json-api/commit/5d87f95))
- **json-api-nestjs:** bump zod to v4 ([23709bd](https://github.com/klerick/nestjs-json-api/commit/23709bd))

### 🩹 Fixes

- **json-api-nestjs:** replace deprecated faker methods, enhance zod schemas with transformations and update constants with METHOD_NAME. change name for method function ([e382bce](https://github.com/klerick/nestjs-json-api/commit/e382bce))
- **json-api-nestjs:** use ErrorFormatService for format error in AtomicOperationModule fix work with tmpId ([6d166ba](https://github.com/klerick/nestjs-json-api/commit/6d166ba))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.4

### ❤️ Thank You

- Alex H

## 10.0.0-beta.5 (2025-05-30)

### 🚀 Features

- **json-api-nestjs:** Export `Params` type in index.ts ([bd509a5](https://github.com/klerick/nestjs-json-api/commit/bd509a5))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.4 (2025-05-23)

### 🚀 Features

- **json-api-nestjs:** Update package.json dep ([87519a0](https://github.com/klerick/nestjs-json-api/commit/87519a0))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.3 (2025-05-23)

### 🚀 Features

- **json-api-nestjs,json-api-nestjs-microorm,json-api-nestjs-sdk,json-api-nestjs-shared,json-api-nestjs-typeorm:** up nestjs ([42b6b82](https://github.com/klerick/nestjs-json-api/commit/42b6b82))

### ❤️ Thank You

- Alex H

## 10.0.0-beta.0 (2025-05-21)

### 🚀 Features

- ⚠️  **json-api-nestjs:** remove module and refactoring ([f202ebc](https://github.com/klerick/nestjs-json-api/commit/f202ebc))

### 🩹 Fixes

- **json-api-nestjs:** Some fix for swagger ([9a0f190](https://github.com/klerick/nestjs-json-api/commit/9a0f190))
- **json-api-nestjs:** Use correct options for check is debug or not ([e52cc92](https://github.com/klerick/nestjs-json-api/commit/e52cc92))
- **json-api-nestjs:** fix type in some place ([61f45e6](https://github.com/klerick/nestjs-json-api/commit/61f45e6))

### ⚠️  Breaking Changes

- **json-api-nestjs:** Change type signature, rename npm package

### ❤️ Thank You

- Alex H

# 9.0.0 (2025-02-12)

### 🚀 Features

- **json-api-nestjs:** Microro orm ([4696f51](https://github.com/klerick/nestjs-json-api/commit/4696f51))
- **json-api-nestjs:** Microro orm ([18f4a0c](https://github.com/klerick/nestjs-json-api/commit/18f4a0c))

### 🩹 Fixes

- **json-api-nestjs:** Fix circular type for query obkect ([e492cd1](https://github.com/klerick/nestjs-json-api/commit/e492cd1))

### ❤️ Thank You

- Alex H

# 8.0.0 (2024-12-18)

### 🚀 Features

- **json-api-nestjs:** Return meta info in atomic operation ([1b61fb3](https://github.com/klerick/nestjs-json-api/commit/1b61fb3))
- **json-api-nestjs:** Allow set id from request for postOne ([6202c22](https://github.com/klerick/nestjs-json-api/commit/6202c22))
- **json-api-nestjs:** Extend validate for array, json and datetime, use nullable if possible ([a8c6f83](https://github.com/klerick/nestjs-json-api/commit/a8c6f83))
- **json-api-nestjs:** Allow call interceptor for each operation in atomic endpoint ([9e0f066](https://github.com/klerick/nestjs-json-api/commit/9e0f066))
- **json-api-nestjs:** Add wrapper transaction options ([8e498a8](https://github.com/klerick/nestjs-json-api/commit/8e498a8))
- **nestjs-json-rpc:** Add support soft delete ([c3b9322](https://github.com/klerick/nestjs-json-api/commit/c3b9322))

### ❤️ Thank You

- Alex H

## 7.0.4 (2024-10-27)


### 🩹 Fixes

- **json-api-nestjs:** Add filter by null ([3af99ff](https://github.com/klerick/nestjs-json-api/commit/3af99ff))


### ❤️  Thank You

- Alex H

## 7.0.3 (2024-05-15)


### 🩹 Fixes

- **json-api-nestjs:** Resource Relationship not allowing data key. ([f648422](https://github.com/klerick/nestjs-json-api/commit/f648422))


### ❤️  Thank You

- Alex H

## 7.0.2 (2024-04-21)


### 🩹 Fixes

- **json-api-nestjs:** Fix validation ([e5e9936](https://github.com/klerick/nestjs-json-api/commit/e5e9936))

- **json-api-nestjs:** Fix validate for patch method ([40b0303](https://github.com/klerick/nestjs-json-api/commit/40b0303))

- **json-api-nestjs:** Fix validate for patch method ([2caa2d8](https://github.com/klerick/nestjs-json-api/commit/2caa2d8))


### ❤️  Thank You

- Alex H

## 7.0.1 (2024-04-06)


### 🩹 Fixes

- **json-api-nestjs:** Fix validation ([1d048a8](https://github.com/klerick/nestjs-json-api/commit/1d048a8))


### ❤️  Thank You

- Alex H

# 7.0.0 (2024-03-08)


### 🚀 Features

- ⚠️  **json-api-nestjs:** new version json-api ([66076a3](https://github.com/klerick/nestjs-json-api/commit/66076a3))


#### ⚠️  Breaking Changes

- **json-api-nestjs:** - remove ajv and use zod for validation

### ❤️  Thank You

- Alex H
