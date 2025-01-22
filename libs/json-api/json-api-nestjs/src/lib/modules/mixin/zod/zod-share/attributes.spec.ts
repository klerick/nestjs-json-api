import { z, ZodError } from 'zod';
import { zodAttributes, ZodAttributes, Attributes } from './attributes';
import { Addresses, Users } from '../../../../mock-utils';
import { FieldWithType, PropsForField, TypeField } from '../../types';

const fieldTypeUsers: FieldWithType<Users> = {
  id: TypeField.number,
  isActive: TypeField.boolean,
  firstName: TypeField.string,
  createdAt: TypeField.date,
  lastName: TypeField.string,
  login: TypeField.string,
  testDate: TypeField.date,
  updatedAt: TypeField.date,
  testReal: TypeField.array,
  testArrayNull: TypeField.array,
};
const propsDb: PropsForField<Users> = {
  id: { type: Number, isArray: false, isNullable: false },
  login: { type: 'varchar', isArray: false, isNullable: false },
  firstName: { type: 'varchar', isArray: false, isNullable: true },
  testReal: { type: 'real', isArray: true, isNullable: false },
  testArrayNull: { type: 'real', isArray: true, isNullable: true },
  lastName: { type: 'varchar', isArray: false, isNullable: true },
  isActive: { type: 'boolean', isArray: false, isNullable: true },
  createdAt: { type: 'timestamp', isArray: false, isNullable: true },
  testDate: { type: 'timestamp', isArray: false, isNullable: true },
  updatedAt: { type: 'timestamp', isArray: false, isNullable: true },
};
const fieldTypeAddresses: FieldWithType<Addresses> = {
  id: TypeField.number,
  arrayField: TypeField.array,
  state: TypeField.string,
  city: TypeField.string,
  createdAt: TypeField.date,
  updatedAt: TypeField.date,
  country: TypeField.string,
};

describe('attributes', () => {
  type SchemaTypeUsers = Attributes<Users>;
  type SchemaTypeAddresses = Attributes<Addresses>;

  describe('Attributes for post', () => {
    let schemaUsers: ZodAttributes<Users>;
    let schemaAddresses: ZodAttributes<Addresses>;
    beforeEach(() => {
      schemaUsers = zodAttributes<Users>(fieldTypeUsers, propsDb, 'id', false);
      schemaAddresses = zodAttributes<Addresses>(
        fieldTypeAddresses,
        {} as PropsForField<Addresses>,
        'id',
        false
      );
    });

    it('should be ok', () => {
      const date = new Date();
      const check: SchemaTypeUsers = {
        login: 'login',
        isActive: true,
        lastName: 'sdsdf',
        testReal: [123.123, 123.123],
        testArrayNull: [],
        testDate: date.toISOString() as any,
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
        isActive: true,
        lastName: 'sdsdf',
        testReal: [123.123, 123.123],
        testArrayNull: null as any,
        testDate: date.toISOString() as any,
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
    let schemaUsers: ZodAttributes<Users, true>;
    let schemaAddresses: ZodAttributes<Addresses, true>;
    beforeEach(() => {
      schemaUsers = zodAttributes<Users, true>(
        fieldTypeUsers,
        propsDb,
        'id',
        true
      );
      schemaAddresses = zodAttributes<Addresses, true>(
        fieldTypeAddresses,
        {} as PropsForField<Addresses>,
        'id',
        true
      );
    });

    it('should be ok', () => {
      const date = new Date();
      const check: SchemaTypeUsers = {
        login: 'login',
        isActive: true,
        testDate: date.toISOString() as any,
      };

      const check2: SchemaTypeAddresses = {
        arrayField: ['test', 'test'],
        state: 'state',
        createdAt: date.toISOString() as any,
        updatedAt: date.toISOString() as any,
      };

      const check3: SchemaTypeUsers = {
        testReal: [123.123, 123.123],
        testArrayNull: null as any,
        testDate: date.toISOString() as any,
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
