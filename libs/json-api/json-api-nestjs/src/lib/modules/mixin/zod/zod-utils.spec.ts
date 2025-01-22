import {
  arrayItemStringLongerThan,
  elementOfArrayMustBe,
  getValidationErrorForStrict,
  nonEmptyObject,
  oneOf,
  stringLongerThan,
  stringMustBe,
  guardIsKeyOfObject,
} from './zod-utils';
import { TypeField } from '../types';

describe('zod-utils', () => {
  describe('guardIsKeyOfObject', () => {
    /**
     * Function Description:
     * The `guardIsKeyOfObject` function acts as a type guard that ensures the given `key`
     * is a valid key of the provided object `R`. If the key exists in the object, the type check passes.
     * Otherwise, it throws an error.
     */
    it('should not throw an error if the key exists in the object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(() => guardIsKeyOfObject(obj, 'a')).not.toThrow();
    });

    it('should throw an error if the key does not exist in the object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(() => guardIsKeyOfObject(obj, 'z')).toThrow('Type guard error');
    });

    it('should throw an error when the object is null', () => {
      const obj = null;
      expect(() => guardIsKeyOfObject(obj, 'a')).toThrow('Type guard error');
    });

    it('should throw an error when the object is undefined', () => {
      const obj = undefined;
      expect(() => guardIsKeyOfObject(obj as any, 'a')).toThrow(
        'Type guard error'
      );
    });

    it('should throw an error for non-object types', () => {
      const nonObject = 42; // A number instead of an object
      expect(() => guardIsKeyOfObject(nonObject as any, 'a')).toThrow(
        'Type guard error'
      );
    });

    it('should work with symbol keys in the object', () => {
      const symbolKey = Symbol('key');
      const obj = { [symbolKey]: 'value' };
      expect(() => guardIsKeyOfObject(obj, symbolKey)).not.toThrow();
    });

    it('should throw an error if the symbol key does not exist', () => {
      const existingSymbol = Symbol('existing');
      const missingSymbol = Symbol('missing');
      const obj = { [existingSymbol]: 'value' };
      expect(() => guardIsKeyOfObject(obj, missingSymbol)).toThrow(
        'Type guard error'
      );
    });

    it('should not throw an error if the number key exists in the object', () => {
      const obj = { 1: 'one', 2: 'two' };
      expect(() => guardIsKeyOfObject(obj, 1)).not.toThrow();
    });

    it('should throw an error if the number key does not exist in the object', () => {
      const obj = { 1: 'one', 2: 'two' };
      expect(() => guardIsKeyOfObject(obj, 3)).toThrow('Type guard error');
    });

    it('should not throw an error for empty object with no keys', () => {
      const obj = {};
      expect(() => guardIsKeyOfObject(obj, 'a')).toThrow('Type guard error');
    });
  });
  describe('nonEmptyObject', () => {
    it('should return true for a non-empty object', () => {
      const isNonEmpty = nonEmptyObject()({ key: 'value' });
      expect(isNonEmpty).toBe(true);
    });

    it('should return false for an empty object', () => {
      const isNonEmpty = nonEmptyObject()({});
      expect(isNonEmpty).toBe(false);
    });

    it('should return false for null value', () => {
      const isNonEmpty = nonEmptyObject()(null);
      expect(isNonEmpty).toBe(false);
    });

    it('should return false for undefined value', () => {
      const isNonEmpty = nonEmptyObject()(undefined);
      expect(isNonEmpty).toBe(false);
    });

    it('should return false for non-object values', () => {
      const isNonEmptyString = nonEmptyObject()('string');
      expect(isNonEmptyString).toBe(false);

      const isNonEmptyNumber = nonEmptyObject()(42);
      expect(isNonEmptyNumber).toBe(false);
      const isNonEmptyArray = nonEmptyObject()([1, 2, 3]);
      expect(isNonEmptyArray).toBe(true);
      const isEmptyArray = nonEmptyObject()([]);
      expect(isEmptyArray).toBe(false);
    });
  });

  describe('getValidationErrorForStrict', () => {
    it('should return a validation error message for "Fields" with props', () => {
      const message = getValidationErrorForStrict(['id', 'name'], 'Fields');
      expect(message).toBe(
        'Validation error: Fields should be have only props: ["id","name"]'
      );
    });

    it('should return a validation error message for "Filter" with props', () => {
      const message = getValidationErrorForStrict(['age', 'gender'], 'Filter');
      expect(message).toBe(
        'Validation error: Filter should be have only props: ["age","gender"]'
      );
    });

    it('should return a message with an empty props array', () => {
      const message = getValidationErrorForStrict([], 'Fields');
      expect(message).toBe(
        'Validation error: Fields should be have only props: [""]'
      );
    });

    it('should handle single prop correctly', () => {
      const message = getValidationErrorForStrict(['id'], 'Fields');
      expect(message).toBe(
        'Validation error: Fields should be have only props: ["id"]'
      );
    });

    it('should handle a large props array', () => {
      const props = ['a', 'b', 'c', 'd', 'e'];
      const message = getValidationErrorForStrict(props, 'Filter');
      expect(message).toBe(
        'Validation error: Filter should be have only props: ["a","b","c","d","e"]'
      );
    });
  });

  describe('oneOf', () => {
    it('should return true if at least one key exists in the object', () => {
      const hasKey = oneOf(['key1', 'key2'])({ key1: 'value1' });
      expect(hasKey).toBe(true);
    });

    it('should return false if none of the keys exist in the object', () => {
      const hasKey = oneOf(['missingKey1', 'missingKey2'])({ key1: 'value1' });
      expect(hasKey).toBe(false);
    });

    it('should return false for an empty object', () => {
      const hasKey = oneOf(['key1', 'key2'])({});
      expect(hasKey).toBe(false);
    });

    it('should return false for null or undefined input', () => {
      const hasKeyInNull = oneOf(['key1', 'key2'])(null);
      expect(hasKeyInNull).toBe(false);

      const hasKeyInUndefined = oneOf(['key1', 'key2'])(undefined);
      expect(hasKeyInUndefined).toBe(false);
    });

    it('should return false for an empty array of keys', () => {
      const hasKey = oneOf([])({ key1: 'value1' });
      expect(hasKey).toBe(false);
    });

    it('should work with overlapping keys', () => {
      const hasKey = oneOf(['key1', 'key2'])({
        key1: 'value1',
        key2: 'value2',
      });
      expect(hasKey).toBe(true);
    });
  });

  describe('stringLongerThan', () => {
    it('should return true if the string is longer than the specified length', () => {
      const isLongerThan = stringLongerThan(5)('testing');
      expect(isLongerThan).toBe(true);
    });

    it('should return false if the string length is equal to the specified length', () => {
      const isLongerThan = stringLongerThan(7)('testing');
      expect(isLongerThan).toBe(false);
    });

    it('should return false if the string is shorter than the specified length', () => {
      const isLongerThan = stringLongerThan(10)('test');
      expect(isLongerThan).toBe(false);
    });

    it('should return false for an empty string when length > 0', () => {
      const isLongerThan = stringLongerThan(1)('');
      expect(isLongerThan).toBe(false);
    });

    it('should return true for length 0 with any non-empty string', () => {
      const isLongerThan = stringLongerThan(0)('t');
      expect(isLongerThan).toBe(true);
    });
  });

  describe('arrayItemStringLongerThan', () => {
    it('should return true if all strings in the array are longer than the specified length', () => {
      const isAllLonger = arrayItemStringLongerThan(3)(['hello', 'world']);
      expect(isAllLonger).toBe(true);
    });

    it('should return false if any string in the array is shorter than or equal to the specified length', () => {
      const isAllLonger = arrayItemStringLongerThan(5)(['short', 'tiny']);
      expect(isAllLonger).toBe(false);
    });

    it('should return false for an array with null values that fail the length check', () => {
      const isAllLonger = arrayItemStringLongerThan(5)([null, 'tiny']);
      expect(isAllLonger).toBe(false);
    });

    it('should return true for an array where all valid strings are longer than the specified length', () => {
      const isAllLonger = arrayItemStringLongerThan(2)([null, 'hello', 'yes']);
      expect(isAllLonger).toBe(true);
    });

    it('should return true if the array is empty', () => {
      const isAllLonger = arrayItemStringLongerThan(3)([] as any);
      expect(isAllLonger).toBe(true);
    });

    it('should return false if any string in the array is shorter and null does not interfere', () => {
      const isAllLonger = arrayItemStringLongerThan(4)(['short', null, 'tiny']);
      expect(isAllLonger).toBe(false);
    });
  });

  describe('stringMustBe', () => {
    it('should return true for a null input', () => {
      const isValid = stringMustBe()(null);
      expect(isValid).toBe(true);
    });

    it('should return true for valid boolean strings', () => {
      const isValidTrue = stringMustBe(TypeField.boolean)('true');
      const isValidFalse = stringMustBe(TypeField.boolean)('false');
      expect(isValidTrue).toBe(true);
      expect(isValidFalse).toBe(true);
    });

    it('should return false for invalid boolean strings', () => {
      const isValid = stringMustBe(TypeField.boolean)('yes');
      expect(isValid).toBe(false);
    });

    it('should return true for numeric strings', () => {
      const isValid = stringMustBe(TypeField.number)('123');
      expect(isValid).toBe(true);
    });

    it('should return false for non-numeric strings when type is number', () => {
      const isValid = stringMustBe(TypeField.number)('abc');
      expect(isValid).toBe(false);
    });

    it('should return true for valid ISO date strings', () => {
      const isValid = stringMustBe(TypeField.date)('2023-10-10');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      const isValid = stringMustBe(TypeField.date)('not-a-date');
      expect(isValid).toBe(false);
    });

    it('should return true for any input when type is string', () => {
      const isValid = stringMustBe(TypeField.string)('any-value');
      expect(isValid).toBe(true);
    });
  });

  describe('elementOfArrayMustBe', () => {
    it('should return true if all elements in the array are valid strings', () => {
      const isValid = elementOfArrayMustBe(TypeField.string)([
        'hello',
        'world',
      ]);
      expect(isValid).toBe(true);
    });

    it('should return false if any element is not a valid string, because before converted to string', () => {
      const isValid = elementOfArrayMustBe(TypeField.string)(['hello', 123]);
      expect(isValid).toBe(true);
    });

    it('should return true if all elements in the array are valid numbers', () => {
      const isValid = elementOfArrayMustBe(TypeField.number)([1, 2, 3]);
      expect(isValid).toBe(true);
    });

    it('should return false if any element is not a valid number', () => {
      const isValid = elementOfArrayMustBe(TypeField.number)([1, 'two', 3]);
      expect(isValid).toBe(false);
    });

    it('should return true if all elements are valid boolean strings', () => {
      const isValid = elementOfArrayMustBe(TypeField.boolean)([
        'true',
        'false',
      ]);
      expect(isValid).toBe(true);
    });

    it('should return false if any element is not a valid boolean string', () => {
      const isValid = elementOfArrayMustBe(TypeField.boolean)([
        'true',
        'hello',
      ]);
      expect(isValid).toBe(false);
    });

    it('should return true for an empty array', () => {
      const isValid = elementOfArrayMustBe(TypeField.string)([]);
      expect(isValid).toBe(true);
    });

    it('should return true if array contains null', () => {
      const isValid = elementOfArrayMustBe(TypeField.string)(['hello', null]);
      expect(isValid).toBe(true);
    });

    it('should return true if all elements are valid dates', () => {
      const isValid = elementOfArrayMustBe(TypeField.date)([
        '2023-01-01',
        '2023-10-10',
      ]);
      expect(isValid).toBe(true);
    });

    it('should return false if any element is not a valid date', () => {
      const isValid = elementOfArrayMustBe(TypeField.date)([
        '2023-01-01',
        'not-a-date',
      ]);
      expect(isValid).toBe(false);
    });
  });
});
