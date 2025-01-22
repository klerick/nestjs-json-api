import { TypeField } from '../types';

export const nonEmptyObject =
  () =>
  <T>(object: T) =>
    !!(typeof object === 'object' && object && Object.keys(object).length > 0);

export const uniqueArray = () => (e: string[]) => new Set(e).size === e.length;

export const getValidationErrorForStrict = (
  props: string[],
  name: 'Fields' | 'Filter'
) =>
  `Validation error: ${name} should be have only props: ["${props.join(
    '","'
  )}"]`;

export const oneOf = (keys: string[]) => (val: any) => {
  if (!val) return false;
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
  (array: [string | null, ...(string | null)[]]) => {
    const checkFunction = stringLongerThan(length);
    return !array.some((i) => i !== null && !checkFunction(i));
  };

export const stringMustBe =
  (type: TypeField = TypeField.string) =>
  (inputString: string | null) => {
    if (inputString === null) return true;
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

export function guardIsKeyOfObject<R>(
  object: R,
  key: string | number | symbol
): asserts key is keyof R {
  if (typeof object === 'object' && object !== null && key in object)
    return void 0;

  throw new Error('Type guard error');
}
