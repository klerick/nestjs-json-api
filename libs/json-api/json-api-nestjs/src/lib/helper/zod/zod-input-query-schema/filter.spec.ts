import { z, ZodError } from 'zod';
import {
  zodFilterFieldSchema,
  zodFilterRelationSchema,
  zodFilterSchema,
} from './filter';

describe('check "filter"', () => {
  describe('Check "zodFilterRelationSchema"', () => {
    it('Valid check', () => {
      const check1: z.infer<typeof zodFilterRelationSchema> = { eq: 'null' };
      const check2: z.infer<typeof zodFilterRelationSchema> = { ne: 'null' };

      const arrayCheck = [check1, check2];

      for (const item of arrayCheck) {
        const result = zodFilterRelationSchema.parse(item);
        expect(result).toEqual(item);
      }
    });

    it('Invalid check', () => {
      const check1 = { eq: null, ne: null };
      const check2 = { eq: 123123 };
      const check3 = { eq: '123123' };
      const check4 = { ne: '123123' };
      const check5 = { ne: true };
      const check6 = { ne: 'true' };
      const check7 = { sdfsdf: 'true' };

      const arrayCheck = [
        check1,
        check2,
        check3,
        check4,
        check5,
        check6,
        check7,
      ];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          zodFilterRelationSchema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });

  describe('Check "zodFilterFieldSchema:', () => {
    it('Valid schema', () => {
      const check1: z.infer<typeof zodFilterFieldSchema> = {
        some: 'sdf',
        ne: 'sdfsdf',
      };
      const check2: z.infer<typeof zodFilterFieldSchema> = {
        eq: 'sdf',
        ne: 'sdfsdf',
        in: 'sdsf',
      };
      const check3: z.infer<typeof zodFilterFieldSchema> = {
        like: 'sdsf',
      };
      const check4: z.infer<typeof zodFilterFieldSchema> = 'dsfsdf';
      const arrayCheck = [check1, check2, check3, check4];
      for (const item of arrayCheck) {
        const result = zodFilterFieldSchema.parse(item);
        expect(result).toEqual(item);
      }
    });

    it('Invalid schema', () => {
      const check1 = { dfd: 'dfsdf' };
      const check2 = { dfd: 'dfsdf', like: 'sdsf' };
      const check3 = {};
      const check4 = [] as any[];
      const check5 = null;
      const check6 = '';

      const arrayCheck = [check1, check2, check3, check4, check5, check6];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          zodFilterFieldSchema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });

  describe('Check "zodFilterSchema"', () => {
    it('Valid schema', () => {
      const check1: z.infer<typeof zodFilterSchema> = {
        some: 'sdf',
        ne: 'sdfsdf',
      };
      const check2: z.infer<typeof zodFilterSchema> = {
        eq: 'sdf',
        ne: 'sdfsdf',
        in: 'sdsf',
      };
      const check3: z.infer<typeof zodFilterSchema> = {
        like: 'sdsf',
      };
      const arrayCheck = [check1, check2, check3];
      for (const item of arrayCheck) {
        const result = zodFilterSchema.parse(item);
        expect(result).toEqual(item);
      }
    });

    it('Invalid schema', () => {
      const check1 = { dfd: 'dfsdf' };
      const check2 = { dfd: 'dfsdf', like: 'sdsf' };
      const check3 = {};
      const check4 = { in: '' };

      const arrayCheck = [check1, check2, check3];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          zodFilterSchema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
});
