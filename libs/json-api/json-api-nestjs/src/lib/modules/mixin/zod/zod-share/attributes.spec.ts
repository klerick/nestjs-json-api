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
});
