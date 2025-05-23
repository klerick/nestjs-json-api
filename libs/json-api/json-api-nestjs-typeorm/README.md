
# json-api-nestjs-typeorm

TypeOrm adapter for **[json-api-nestjs](https://github.com/klerick/nestjs-json-api/tree/master/libs/json-api/json-api-nestjs)**

## Installation

```bash  
$ npm install @klerick/json-api-nestjs-typeorm
```  


## Configuration params

The following interface is using for the configuration:

```typescript
export type TypeOrmParam = {
  useSoftDelete?: boolean // Use soft delete
  runInTransaction?: <Func extends (...args: any) => any>(
    isolationLevel: IsolationLevel,
    fn: Func
  ) => ReturnType<Func> // You can use cutom function for wrapping transaction in atomic operation, example: runInTransaction from https://github.com/Aliheym/typeorm-transactional
};
```
