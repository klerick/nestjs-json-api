import {
  oneOf,
  stringLongerThan,
  arrayItemStringLongerThan,
  uniqueArray,
  nonEmptyObject,
} from './zod-utils';

describe('zod-utils', () => {
  let checkFunk: (arg: any) => boolean;
  describe('oneOf', () => {
    beforeAll(() => {
      checkFunk = oneOf(['props', 'props1', 'props2']);
    });

    it('Should be ok', () => {
      const result1 = checkFunk({ props: 1 });
      const result2 = checkFunk({ props: 1, other: 1 });
      const result3 = checkFunk({ props2: 1, other: 1 });
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it('Should be not ok', () => {
      const result1 = checkFunk({});
      const result2 = checkFunk({ other: 1 });
      const result3 = checkFunk({ props4: 1, other: 1 });
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('stringLongerThan', () => {
    beforeAll(() => {
      checkFunk = stringLongerThan(5);
    });
    it('Should be ok', () => {
      const result = checkFunk('123456');
      expect(result).toBe(true);
    });

    it('Should be not ok', () => {
      const result = checkFunk('12345');
      const result2 = checkFunk('1234');
      expect(result).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('arrayItemStringLongerThan', () => {
    beforeAll(() => {
      checkFunk = arrayItemStringLongerThan(5);
    });
    it('Should be ok', () => {
      const result = checkFunk(['123456', '123456']);
      expect(result).toBe(true);
    });

    it('Should be not ok', () => {
      const result = checkFunk(['12345', '123456']);
      const result2 = checkFunk(['1234', '123456']);
      const result3 = checkFunk(['123456', '1234']);
      expect(result).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('uniqueArray', () => {
    beforeAll(() => {
      checkFunk = uniqueArray();
    });
    it('Should be ok', () => {
      const result = checkFunk(['1', '2', '3', '4']);
      const result2 = checkFunk([1, 2, 3, 4]);
      expect(result).toBe(true);
      expect(result2).toBe(true);
    });

    it('Should be not ok', () => {
      const result = checkFunk(['1', '1', '123456']);
      const result2 = checkFunk(['1', '123456', '1']);
      const result3 = checkFunk([1, '1234', 1]);
      expect(result).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('nonEmptyObject', () => {
    beforeAll(() => {
      checkFunk = nonEmptyObject();
    });
    it('Should be ok', () => {
      const result = checkFunk({ test: 1 });
      expect(result).toBe(true);
    });

    it('Should be not ok', () => {
      const result = checkFunk({});
      const result2 = checkFunk(undefined);
      expect(result).toBe(false);
      expect(result2).toBe(false);
    });
  });
});
