import { TypeField } from '../orm';

export const oneOf = (keys: string[]) => (val: any) => {
  for (const k of keys) {
    if (val[k] !== undefined) return true;
  }
  return false;
};

export const stringLongerThan =
  (length = 0) =>
  (str: string) =>
    str.length > length;

export const arrayItemStringLongerThan =
  (length = 0) =>
  (array: [string, ...string[]]) => {
    const checkFunction = stringLongerThan(length);
    return !array.some((i) => !checkFunction(i));
  };

export const stringMustBe =
  (type: TypeField = TypeField.string) =>
  (inputString: string) => {
    switch (type) {
      case TypeField.boolean:
        return inputString === 'true' || inputString === 'false';
      case TypeField.number:
        return !isNaN(+inputString);
      case TypeField.date:
        return new Date(inputString).toString() !== 'Invalid Date';
      default:
        return true;
    }
  };
export const elementOfArrayMustBe =
  (type: TypeField = TypeField.string) =>
  (inputArray: unknown[]) => {
    const checkFunc = stringMustBe(type);
    return !inputArray.some((i) => !checkFunc(`${i}`));
  };
export const uniqueArray = () => (e: string[]) => new Set(e).size === e.length;

export const nonEmptyObject =
  () =>
  <T>(object: T) =>
    !!(object && Object.keys(object).length > 0);

export const getValidationErrorForStrict = (
  props: string[],
  name: 'Fields' | 'Filter'
) =>
  `Validation error: ${name} should be have only props: ["${props.join(
    '","'
  )}"]`;
