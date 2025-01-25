import { Test, TestingModule } from '@nestjs/testing';
import {
  MetadataStorage,
  EntityManager,
  Collection,
  MikroORM,
} from '@mikro-orm/core';
import {
  EntityProps,
  EntityRelation,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';
import { IMemoryDb } from 'pg-mem';

import { createAndPullSchemaBase } from '../../../mock-utils';
import {
  mockDBTestModule,
  Users,
  pullAllData,
  pullUser,
  Addresses,
  Notes,
  Roles,
} from '../../../mock-utils/microrom';
import {
  CurrentMicroOrmProvider,
  CurrentEntityManager,
  CurrentEntityMetadata,
} from '../factory';

import { DEFAULT_ARRAY_TYPE, ENTITY_METADATA_TOKEN } from '../constants';

import {
  getField,
  getPropsTreeForRepository,
  getArrayPropsForEntity,
  getArrayFields,
  getFieldWithType,
  getTypeForAllProps,
  getRelationTypeArray,
  getTypePrimaryColumn,
  getPropsFromDb,
  getRelationTypeName,
  getRelationTypePrimaryColumn,
} from './';
import { CURRENT_ENTITY_MANAGER_TOKEN } from '../../../constants';

import { ArrayPropsForEntity, PropsArray, TypeField } from '../../mixin/types';

describe('microorm-orm-helper', () => {
  let db: IMemoryDb;
  let entityMetadataToken: MetadataStorage;
  let em: EntityManager;
  let user: Users;
  let userWithRelation: Users;
  let mikroORM: MikroORM;
  const config = DEFAULT_ARRAY_TYPE;
  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        CurrentMicroOrmProvider(),
        CurrentEntityManager(),
        CurrentEntityMetadata(),
      ],
    }).compile();

    entityMetadataToken = module.get(ENTITY_METADATA_TOKEN);
    em = module.get(CURRENT_ENTITY_MANAGER_TOKEN);
    mikroORM = module.get(MikroORM);
    user = await pullUser();
    const { roles, comments, notes, ...other } = user;
    user = other as Users;
    user.id = 1;

    userWithRelation = await pullAllData(em);
  });

  afterAll(() => {
    mikroORM.close(true);
  });

  it('getField', async () => {
    const { field, relations } = getField(entityMetadataToken.get(Users));

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
    )
      .filter((props) => !userFieldProps.includes(props))
      .filter((i) => i !== '__helper' && i !== '__gettersDefined');

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
    const relationField = getPropsTreeForRepository(entityMetadataToken, Users);
    const userFieldProps = Object.getOwnPropertyNames(
      user
    ) as EntityProps<Users>[];

    const userRelationProps: EntityRelation<Users>[] = (
      Object.getOwnPropertyNames(userWithRelation) as (EntityProps<Users> &
        EntityRelation<Users>)[]
    )
      .filter((props) => !userFieldProps.includes(props))
      .filter((i) => i !== '__helper' && i !== '__gettersDefined');

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
        const target =
          targetItem instanceof Collection
            ? targetItem.getItems().at(0)
            : targetItem;
        if (!target) return true;

        // @ts-ignore
        return !ObjectTyped.keys(target).includes(field);
      });
      expect(check).toEqual(false);
    }
  });

  it('getArrayPropsForEntity', () => {
    const result = getArrayPropsForEntity(entityMetadataToken, Users, config);
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

  it('getArrayFields', () => {
    const result = getArrayFields(entityMetadataToken.get(Addresses), config);
    expect(result).toEqual({
      arrayField: true,
    } as PropsArray<Addresses>);
  });

  it('getFieldWithType', () => {
    const result = getFieldWithType(entityMetadataToken.get(Addresses), config);
    expect(result.arrayField).toBe('array');
    expect(result.state).toBe('string');
    expect(result.id).toBe('number');
    expect(result.createdAt).toBe('date');
    const result2 = getFieldWithType(entityMetadataToken.get(Users), config);

    expect(result2.isActive).toBe('boolean');
  });

  it('getTypeForAllProps', () => {
    const result = getTypeForAllProps(entityMetadataToken, Users, config);
    expect(result.manager.id).toBe(TypeField.number);
    expect(result.testDate).toBe(TypeField.date);
    // @ts-ignore
    expect(result.comments.id).toBe(TypeField.number);
    // @ts-ignore
    expect(result.notes.id).toBe(TypeField.string);
  });

  it('getRelationType', () => {
    const result = getRelationTypeArray(entityMetadataToken.get(Users));
    expect(result.roles).toBe(true);
    expect(result.comments).toBe(true);
    expect(result.manager).toBe(false);
    expect(result.addresses).toBe(false);
    expect(result.userGroup).toBe(false);
    expect(result.notes).toBe(true);
  });

  it('getTypePrimaryColumn', () => {
    expect(getTypePrimaryColumn(entityMetadataToken.get(Users))).toBe(
      TypeField.number
    );
    expect(getTypePrimaryColumn(entityMetadataToken.get(Notes))).toBe(
      TypeField.string
    );
  });

  it('getPropsFromDb', () => {
    const result = getPropsFromDb(entityMetadataToken.get(Users), config);
    // testReal has isNullable false but have default should be true
    expect(result['testReal']).toEqual({
      type: 'real',
      isArray: true,
      isNullable: true,
    });

    const result2 = getPropsFromDb(entityMetadataToken.get(Roles), config);
    expect(result2['key']).toEqual({
      type: 'varchar',
      isArray: false,
      isNullable: false,
    });
  });

  it('getRelationTypeName', () => {
    const result = getRelationTypeName(entityMetadataToken.get(Users));
    expect(result.roles).toBe('Roles');
    expect(result.comments).toBe('Comments');
    expect(result.manager).toBe('Users');
    expect(result.addresses).toBe('Addresses');
    expect(result.userGroup).toBe('UserGroups');
    expect(result.notes).toBe('Notes');
  });

  it('getRelationTypePrimaryColumn', () => {
    const result = getRelationTypePrimaryColumn(entityMetadataToken, Users);
    expect(result.roles).toBe(TypeField.number);
    expect(result.comments).toBe(TypeField.number);
    expect(result.manager).toBe(TypeField.number);
    expect(result.addresses).toBe(TypeField.number);
    expect(result.userGroup).toBe(TypeField.number);
    expect(result.notes).toBe(TypeField.string);
  });
});
