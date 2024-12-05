import { z, ZodError } from 'zod';
import { zodAttributesSchema, ZodAttributesSchema } from './attributes';
import { Addresses, Users } from '../../../mock-utils';
import { FieldWithType, PropsForField, TypeField } from '../../orm';

describe('attributes', () => {
  let schemaUsers: ZodAttributesSchema<Users>;
  let schemaAddresses: ZodAttributesSchema<Addresses>;
  type SchemaTypeUsers = z.infer<ZodAttributesSchema<Users>>;
  type SchemaTypeAddresses = z.infer<ZodAttributesSchema<Addresses>>;
  beforeAll(() => {
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
    schemaUsers = zodAttributesSchema<Users>(fieldTypeUsers, propsDb);
    schemaAddresses = zodAttributesSchema<Addresses>(
      fieldTypeAddresses,
      {} as PropsForField<Addresses>
    );
  });

  it('should be ok', () => {
    const check: SchemaTypeUsers = {
      isActive: true,
      lastName: 'sdsdf',
      testReal: [123.123, 123.123],
    };
    const check2: SchemaTypeAddresses = {
      arrayField: ['test', 'test'],
    };
    const date = new Date();
    const check3 = {
      testDate: date.toISOString(),
    };
    expect(schemaUsers.parse(check)).toEqual(check);
    expect(schemaAddresses.parse(check2)).toEqual(check2);
    expect(schemaUsers.parse(check3)).toEqual({
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
