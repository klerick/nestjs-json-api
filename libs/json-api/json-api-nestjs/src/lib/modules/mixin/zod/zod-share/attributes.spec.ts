import { ZodError } from 'zod';
import { zodAttributes, ZodAttributes, Attributes } from './attributes';
import {
  addressesEntityParamMapMockData,
  usersEntityParamMapMockData,
} from '../../../../utils/___test___/test.helper';
import {
  Users,
  Addresses,
} from '../../../../utils/___test___/test-classes.helper';
import { ExtractJsonApiReadOnlyKeys, ExtractJsonApiImmutableKeys } from '../../../../types';

describe('attributes', () => {
  describe('Attributes for post', () => {
    type SchemaTypeUsers = Attributes<Users, 'id'>;
    type SchemaTypeAddresses = Attributes<Addresses, 'id'>;
    let schemaUsers: ZodAttributes<Users, 'id'>;
    let schemaAddresses: ZodAttributes<Addresses, 'id'>;
    beforeEach(() => {
      schemaUsers = zodAttributes(usersEntityParamMapMockData, false);
      schemaAddresses = zodAttributes(addressesEntityParamMapMockData, false);
    });

    it('should be ok', () => {
      const date = new Date();
      const check: SchemaTypeUsers = {
        login: 'login',
        isActive: 'null',
        lastName: 'sdsdf',
        testReal: [123.123, 123.123],
        testArrayNull: [],
        testDate: date.toISOString() as any,
        createdAt: date.toISOString() as any,
        updatedAt: date.toISOString() as any,
        firstName: '',
      };

      const check2: SchemaTypeAddresses = {
        arrayField: ['test', 'test'],
        state: 'state',
        country: 'country',
        city: 'city',
        createdAt: date.toISOString() as any,
        updatedAt: date.toISOString() as any,
      };

      const check3: SchemaTypeUsers = {
        login: 'login',
        lastName: 'sdsdf',
        testReal: [123.123, 123.123],
        testArrayNull: null as any,
        testDate: date.toISOString() as any,
        firstName: '',
        createdAt: date.toISOString() as any,
        updatedAt: date.toISOString() as any,
      };

      expect(schemaUsers.parse(check)).toEqual({
        ...check,
        testDate: date,
        createdAt: date,
        updatedAt: date,
      });
      expect(schemaAddresses.parse(check2)).toEqual({
        ...check2,
        createdAt: date,
        updatedAt: date,
      });

      expect(schemaUsers.parse(check3)).toEqual({
        ...check3,
        testDate: date,
        createdAt: date,
        updatedAt: date,
      });
    });

    it('should be not ok', () => {
      const check = {
        id: '1',
        isActive: 'true',
        lastName: 1,
      };
      const check2 = {
        arrayField: 'test',
      };
      expect.assertions(2);
      try {
        expect(schemaUsers.parse(check)).toEqual(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
      try {
        schemaAddresses.parse(check2);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    });
  });

  describe('Attributes for patch', () => {
    type SchemaTypeUsers = Attributes<Users, 'id', true>;
    type a = SchemaTypeUsers['testDate']
    type SchemaTypeAddresses = Attributes<Addresses, 'id', true>;
    let schemaUsers: ZodAttributes<Users, 'id', true>;
    let schemaAddresses: ZodAttributes<Addresses, 'id', true>;
    beforeEach(() => {
      schemaUsers = zodAttributes(usersEntityParamMapMockData, true);
      schemaAddresses = zodAttributes(addressesEntityParamMapMockData, true);
    });

    it('should be ok', () => {
      const date = new Date();
      const check: SchemaTypeUsers = {
        login: 'login',
        testDate: date.toISOString() as any,
        firstName: '',
        testReal: [],
        createdAt: undefined,
        updatedAt: undefined,
      };

      const check2: SchemaTypeAddresses = {
        arrayField: ['test', 'test'],
        state: 'state',
        createdAt: date.toISOString() as any,
        updatedAt: date.toISOString() as any,
        city: '',
        country: '',
      };

      const check3: SchemaTypeUsers = {
        testReal: [123.123, 123.123],
        testArrayNull: null as any,
        testDate: date.toISOString() as any,
        login: '',
        firstName: '',
        createdAt: undefined,
        updatedAt: undefined,
      };

      expect(schemaUsers.parse(check)).toEqual({
        ...check,
        testDate: date,
      });
      expect(schemaAddresses.parse(check2)).toEqual({
        ...check2,
        createdAt: date,
        updatedAt: date,
      });

      expect(schemaUsers.parse(check3)).toEqual({
        ...check3,
        testDate: date,
      });
    });

    it('should be not ok', () => {
      const check = {
        id: '1',
      };
      const check2 = {
        arrayField: 'test',
      };
      expect.assertions(2);
      try {
        expect(schemaUsers.parse(check)).toEqual(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
      try {
        schemaAddresses.parse(check2);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    });
  });

  describe('Attributes with readOnlyProps', () => {
    it('should exclude read-only fields from schema', () => {
      const readOnlyProps = ['createdAt', 'updatedAt'] as ExtractJsonApiReadOnlyKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, false, readOnlyProps);
      const date = new Date();

      // Should pass without read-only fields
      const validData = {
        login: 'login',
        firstName: 'first',
        lastName: 'last',
        isActive: null,
        testReal: [1, 2],
        testArrayNull: null,
        testDate: date.toISOString(),
      };

      const result = schema.parse(validData);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should reject data containing read-only fields (strict mode)', () => {
      const readOnlyProps = ['createdAt', 'updatedAt'] as ExtractJsonApiReadOnlyKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, false, readOnlyProps);
      const date = new Date();

      // Should fail with read-only fields
      const invalidData = {
        login: 'login',
        firstName: 'first',
        lastName: 'last',
        isActive: null,
        testReal: [1, 2],
        testArrayNull: null,
        testDate: date.toISOString(),
        createdAt: date.toISOString(), // read-only field
        updatedAt: date.toISOString(), // read-only field
      };

      expect(() => schema.parse(invalidData)).toThrow(ZodError);
    });

    it('should work with patch mode and readOnlyProps', () => {
      const readOnlyProps = ['createdAt', 'updatedAt'] as ExtractJsonApiReadOnlyKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, true, readOnlyProps);
      const date = new Date();

      // Should pass with partial data (patch mode)
      const validData = {
        login: 'login',
        firstName: 'first',
      };

      const result = schema.parse(validData);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('should reject patch data containing read-only fields', () => {
      const readOnlyProps = ['createdAt', 'updatedAt'] as ExtractJsonApiReadOnlyKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, true, readOnlyProps);
      const date = new Date();

      // Should fail with read-only fields in patch
      const invalidData = {
        login: 'login',
        createdAt: date.toISOString(), // read-only field
      };

      expect(() => schema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('Attributes with immutableProps', () => {
    it('should make immutable fields optional in POST mode', () => {
      const immutableProps = ['login'] as ExtractJsonApiImmutableKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, false, [], immutableProps);
      const date = new Date();

      // Should pass without immutable field (login is optional)
      const validDataWithoutLogin = {
        firstName: 'first',
        lastName: 'last',
        isActive: null,
        testReal: [1, 2],
        testArrayNull: null,
        testDate: date.toISOString(),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      };

      const result1 = schema.parse(validDataWithoutLogin);
      expect(result1).toBeDefined();
      expect(result1).not.toHaveProperty('login');

      // Should also pass with immutable field provided
      const validDataWithLogin = {
        ...validDataWithoutLogin,
        login: 'mylogin',
      };

      const result2 = schema.parse(validDataWithLogin);
      expect(result2).toBeDefined();
      expect(result2).toHaveProperty('login', 'mylogin');
    });

    it('should exclude immutable fields from PATCH mode', () => {
      const immutableProps = ['login'] as ExtractJsonApiImmutableKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, true, [], immutableProps);

      // Should pass without immutable field
      const validData = {
        firstName: 'first',
      };

      const result = schema.parse(validData);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('login');

      // Should reject data with immutable field (strict mode - field not in schema)
      const dataWithLogin = {
        firstName: 'first',
        login: 'mylogin',
      };
      expect(() => schema.parse(dataWithLogin)).toThrow(ZodError);
    });

    it('should reject PATCH data containing immutable fields', () => {
      const immutableProps = ['login'] as ExtractJsonApiImmutableKeys<Users>[];
      const schema = zodAttributes(usersEntityParamMapMockData, true, [], immutableProps);

      // Should fail with immutable field in patch
      const invalidData = {
        firstName: 'first',
        login: 'login', // immutable field - not allowed in PATCH
      };

      expect(() => schema.parse(invalidData)).toThrow(ZodError);
    });
  });
});
