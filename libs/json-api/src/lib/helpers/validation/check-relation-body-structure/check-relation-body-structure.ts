import { ValidationError } from '../../../types';


export async function checkRelationBodyStructure(value: any, isNullable = false): Promise<ValidationError[]> {
  if (value === undefined) {
    return [{
      source: { pointer: '' },
      detail: "Body must have a 'data' definition",
    }];
  }

  if (!isNullable && (value === null)) {
    return [{
      source: { pointer: '' },
      detail: "Body 'data' must not be empty",
    }];
  }

  return [];
}
