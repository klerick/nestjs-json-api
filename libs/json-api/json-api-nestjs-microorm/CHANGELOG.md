## 0.1.0-beta.21 (2026-02-16)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.18

## 0.1.0-beta.20 (2026-02-11)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.17

## 0.1.0-beta.19 (2026-02-07)

### 🩹 Fixes

- **json-api-nestjs-microorm:** exclude non-persistent properties from relation mapping ([8d373ba](https://github.com/klerick/nestjs-json-api/commit/8d373ba))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.18 (2026-02-05)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.16

## 0.1.0-beta.17 (2026-02-01)

### 🚀 Features

- **json-api-nestjs-microorm:** optimize entity operations with `entityManager` over `queryBuilder` and implement diff-based relationship handling ([406ead6](https://github.com/klerick/nestjs-json-api/commit/406ead6))
- **json-api-nestjs-microorm:** exclude primary key from props and update related tests ([c4cf0bb](https://github.com/klerick/nestjs-json-api/commit/c4cf0bb))

### 🩹 Fixes

- **json-api-nestjs-microorm:** update test to exclude primary key validation in properties ([8cfdf1d](https://github.com/klerick/nestjs-json-api/commit/8cfdf1d))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.7
- Updated json-api-nestjs to 10.0.0-beta.15

### ❤️ Thank You

- Alex H

## 0.1.0-beta.16 (2026-01-23)

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.6
- Updated json-api-nestjs to 10.0.0-beta.14

## 0.1.0-beta.15 (2026-01-23)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.13

## 0.1.0-beta.14 (2026-01-23)

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.5
- Updated json-api-nestjs to 10.0.0-beta.12

## 0.1.0-beta.13 (2026-01-22)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.11

## 0.1.0-beta.12 (2026-01-21)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.10

## 0.1.0-beta.11 (2026-01-20)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.9

## 0.1.0-beta.10 (2026-01-19)

### 🚀 Features

- **json-api-nestjs,json-api-nestjs-microorm,json-api-nestjs-typeorm:** add support for automatic resource linkage in to-one relations, update FK field detection and handling ([0dd670d](https://github.com/klerick/nestjs-json-api/commit/0dd670d))

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.8

### ❤️ Thank You

- Alex H

## 0.1.0-beta.9 (2025-12-26)

### 🧱 Updated Dependencies

- Updated json-api-nestjs to 10.0.0-beta.7

## 0.1.0-beta.8 (2025-11-13)

### 🚀 Features

- **json-api-nestjs-microorm:** enhance `getOne` and `getAll` with transform toggles and additional query params, add relationship loading utility and improve logging ([bb808cd](https://github.com/klerick/nestjs-json-api/commit/bb808cd))
- **json-api-nestjs-microorm:** fix after update nx ([03da82f](https://github.com/klerick/nestjs-json-api/commit/03da82f))
- **json-api-nestjs-microorm:** fix after update nx ([5cdf997](https://github.com/klerick/nestjs-json-api/commit/5cdf997))
- **json-api-nestjs-microorm:** improve type handling and simplify relation processing in utility service and `postOne` method ([1a47099](https://github.com/klerick/nestjs-json-api/commit/1a47099))

### 🩹 Fixes

- **json-api-nestjs-microorm:** replace deprecated faker methods and add PGlite compatibility in MikroORM setup ([1d0b83b](https://github.com/klerick/nestjs-json-api/commit/1d0b83b))

### 🧱 Updated Dependencies

- Updated json-api-nestjs-shared to 1.0.0-beta.4
- Updated json-api-nestjs to 10.0.0-beta.6

### ❤️ Thank You

- Alex H

## 0.1.0-beta.7 (2025-06-23)

### 🩹 Fixes

- **json-api-nestjs-microorm:** add format for mikroorm error ([c1cafc2](https://github.com/klerick/nestjs-json-api/commit/c1cafc2))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.6 (2025-06-10)

### 🩹 Fixes

- **json-api-nestjs-microorm:** ensure `applyFilters` is invoked in query builders for consistency ([391f4bb](https://github.com/klerick/nestjs-json-api/commit/391f4bb))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.5 (2025-06-10)

### 🩹 Fixes

- **json-api-nestjs-microorm:** Handle defaultRaw in nullable props check and update entity properties ([6d7a24f](https://github.com/klerick/nestjs-json-api/commit/6d7a24f))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.4 (2025-05-24)

### 🩹 Fixes

- **json-api-nestjs-microorm:** Remove @mikro-orm/postgresql dependencies in package.json ([277f61c](https://github.com/klerick/nestjs-json-api/commit/277f61c))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.3 (2025-05-23)

### 🚀 Features

- **json-api-nestjs,json-api-nestjs-microorm,json-api-nestjs-sdk,json-api-nestjs-shared,json-api-nestjs-typeorm:** up nestjs ([42b6b82](https://github.com/klerick/nestjs-json-api/commit/42b6b82))

### ❤️ Thank You

- Alex H

## 0.1.0-beta.0 (2025-05-21)

### 🚀 Features

- **json-api-nestjs-microorm:** Adapter for microorm ([cd56636](https://github.com/klerick/nestjs-json-api/commit/cd56636))

### 🩹 Fixes

- **json-api-nestjs-typeorm, json-api-nestjs-microorm:** Fix mysql like error ([780bbf9](https://github.com/klerick/nestjs-json-api/commit/780bbf9))

### ❤️ Thank You

- Alex H
