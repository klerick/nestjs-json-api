import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMemoryDb } from 'pg-mem';

import {
  mockDBTestModule,
  createAndPullSchemaBase,
  pullUser,
  pullAllData,
  providerEntities,
  getRepository,
  Users,
  Addresses,
  Notes,
  Comments,
  Roles,
  UserGroups,
} from '../../mock-utils';
import { EntityProps, EntityRelation, TypeOfArray } from '../../types';
import {
  getField,
  getPropsTreeForRepository,
  fromRelationTreeToArrayName,
  getArrayFields,
  PropsArray,
  getArrayPropsForEntity,
  ArrayPropsForEntity,
  getFieldWithType,
  getRelationTypeArray,
  getRelationTypeName,
  getRelationTypePrimaryColumn,
  TypeField,
  getTypePrimaryColumn,
  getPrimaryColumnsForRelation,
  getIsArrayRelation,
  getTypeForAllProps,
  getPropsFromDb,
} from './orm-helper';
import { ObjectTyped } from '../utils';

describe('zod-helper', () => {
  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;
  let db: IMemoryDb;
  let user: Users;
  let userWithRelation: Users;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [...providerEntities(getDataSourceToken())],
    }).compile();
    ({
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository,
    } = getRepository(module));

    user = await pullUser(userRepository);
    userWithRelation = await pullAllData(
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository
    );
  });

  it('getField', async () => {
    const { relations, field } = getField(userRepository);
    const userFieldProps = Object.getOwnPropertyNames(
      user
    ) as EntityProps<Users>[];
    const hasUserFieldInResultField = userFieldProps.some(
      (field) => !field.includes(field)
    );

    const hasResultInUserField = field.some(
      (field) => !userFieldProps.includes(field)
    );

    const userRelationProps: EntityRelation<Users>[] = (
      Object.getOwnPropertyNames(userWithRelation) as (EntityProps<Users> &
        EntityRelation<Users>)[]
    ).filter((props) => !userFieldProps.includes(props));

    const hasUserRelationInResultField = userRelationProps.some(
      (field) => !relations.includes(field)
    );

    const hasResultInUserRelation = relations.some(
      (field) => !userRelationProps.includes(field)
    );

    expect(hasUserFieldInResultField).toEqual(false);
    expect(hasResultInUserField).toEqual(false);

    expect(hasUserRelationInResultField).toEqual(false);
    expect(hasResultInUserRelation).toEqual(false);
  });

  it('getPropsTreeForRepository', () => {
    const relationField = getPropsTreeForRepository(userRepository);
    const userFieldProps = Object.getOwnPropertyNames(
      user
    ) as EntityProps<Users>[];
    const userRelationProps: EntityRelation<Users>[] = (
      Object.getOwnPropertyNames(userWithRelation) as (EntityProps<Users> &
        EntityRelation<Users>)[]
    ).filter((props) => !userFieldProps.includes(props));

    const hasUserRelationInResultField = userRelationProps.some(
      (field) => !Object.keys(relationField).includes(field)
    );
    const hasResultInUserRelation = ObjectTyped.keys(relationField).some(
      (field) => !userRelationProps.includes(field)
    );
    expect(hasUserRelationInResultField).toEqual(false);
    expect(hasResultInUserRelation).toEqual(false);

    for (const [relationName, fieldsRelation] of ObjectTyped.entries(
      relationField
    )) {
      const check = fieldsRelation.some((field) => {
        const targetItem = userWithRelation[relationName];
        const target = Array.isArray(targetItem) ? targetItem[0] : targetItem;
        // @ts-ignore
        return !ObjectTyped.keys(target).includes(field);
      });
      expect(check).toEqual(false);
    }
  });

  it('fromRelationTreeToArrayName', () => {
    const { relations, field } = getField(userRepository);

    const relationField = getPropsTreeForRepository(userRepository);
    const checkArray = fromRelationTreeToArrayName(relationField);

    for (const key of relations) {
      let resultKey =
        key === 'manager' ? 'Users' : key === 'userGroup' ? 'UserGroups' : key;

      const relationsRepo =
        userRepository.metadata.connection.getRepository<
          TypeOfArray<Users[typeof key]>
        >(resultKey);
      const { field: relationsFields } = getField(relationsRepo);
      const textField = relationsFields.map((r) => `${key}.${r}`);
      const check = textField.some((i) => !checkArray.includes(i as any));
      expect(check).toEqual(false);
    }
  });

  it('getArrayFields', () => {
    const result = getArrayFields(addressesRepository);
    expect(result).toEqual({
      arrayField: true,
    } as PropsArray<Addresses>);
  });

  it('getArrayPropsForEntity', () => {
    const result = getArrayPropsForEntity(userRepository);
    const check: ArrayPropsForEntity<Users> = {
      target: {
        testReal: true,
        testArrayNull: true,
      },
      manager: {
        testReal: true,
        testArrayNull: true,
      },
      comments: {},
      notes: {},
      userGroup: {},
      roles: {},
      addresses: {
        arrayField: true,
      },
    };
    expect(result).toEqual(check);
  });

  it('getFieldWithType', () => {
    const result = getFieldWithType(addressesRepository);
    expect(result.arrayField).toBe('array');
    expect(result.state).toBe('string');
    expect(result.id).toBe('number');
    expect(result.createdAt).toBe('date');
    const result2 = getFieldWithType(userRepository);

    expect(result2.isActive).toBe('boolean');
  });

  it('getRelationType', () => {
    const result = getRelationTypeArray(userRepository);
    expect(result.roles).toBe(true);
    expect(result.comments).toBe(true);
    expect(result.manager).toBe(false);
    expect(result.addresses).toBe(false);
    expect(result.userGroup).toBe(false);
    expect(result.notes).toBe(true);
  });

  it('getRelationTypeName', () => {
    const result = getRelationTypeName(userRepository);
    expect(result.roles).toBe('Roles');
    expect(result.comments).toBe('Comments');
    expect(result.manager).toBe('Users');
    expect(result.addresses).toBe('Addresses');
    expect(result.userGroup).toBe('UserGroups');
    expect(result.notes).toBe('Notes');
  });

  it('getRelationTypePrimaryColumn', () => {
    const result = getRelationTypePrimaryColumn(userRepository);
    expect(result.roles).toBe(TypeField.number);
    expect(result.comments).toBe(TypeField.number);
    expect(result.manager).toBe(TypeField.number);
    expect(result.addresses).toBe(TypeField.number);
    expect(result.userGroup).toBe(TypeField.number);
    expect(result.notes).toBe(TypeField.string);
  });

  it('getTypePrimaryColumn', () => {
    expect(getTypePrimaryColumn(userRepository)).toBe(TypeField.number);
    expect(getTypePrimaryColumn(notesRepository)).toBe(TypeField.string);
  });

  it('getPrimaryColumnsForRelation', () => {
    const result = getPrimaryColumnsForRelation(userRepository);
    expect(result.roles).toBe('id');
    expect(result.manager).toBe('id');
  });

  it('geTisArrayRelation', () => {
    const result = getIsArrayRelation(userRepository);
    expect(result).toEqual({
      addresses: false,
      manager: false,
      roles: true,
      comments: true,
      notes: true,
      userGroup: false,
    });
  });

  it('getTypeForAllProps', () => {
    const result = getTypeForAllProps(userRepository);
    expect(result.manager.id).toBe(TypeField.number);
    expect(result.testDate).toBe(TypeField.date);
    expect(result.comments.id).toBe(TypeField.number);
    expect(result.notes.id).toBe(TypeField.string);
  });

  it('getPropsFromDb', () => {
    const result = getPropsFromDb(userRepository);
    expect(result['testReal']).toEqual({
      type: 'real',
      isArray: true,
      isNullable: false,
    });
  });
});
