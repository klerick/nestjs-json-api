import { EntityMetadata } from 'typeorm';

export const formErrorString = (
  entityMetadata: EntityMetadata,
  errorText: string
) => {
  for (const column of entityMetadata.columns) {
    const result = new RegExp(column.databaseName).test(errorText);
    if (!result) continue;

    errorText = errorText.replace(column.databaseName, column.propertyName);
  }
  return errorText.replace(entityMetadata.tableName, entityMetadata.name);
};
