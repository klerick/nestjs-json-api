import { z, ZodError } from 'zod';
import { zodAttributesSchema, ZodAttributesSchema } from './attributes';
import { Addresses, Users } from '../../../mock-utils';
import { FieldWithType, TypeField } from '../../orm';

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
    schemaUsers = zodAttributesSchema<Users>(fieldTypeUsers);
    schemaAddresses = zodAttributesSchema<Addresses>(fieldTypeAddresses);
  });

  it('should be ok', () => {
    const check: SchemaTypeUsers = {
      isActive: true,
      lastName: 'sdsdf',
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
