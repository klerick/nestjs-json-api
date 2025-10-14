import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { ORM_SERVICE } from '@klerick/json-api-nestjs';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';

import {
  Addresses,
  dbRandomName,
  getModuleForPgLite,
  Notes,
  pullData,
  Roles,
  UserGroups,
  Users,
  Comments,
  pullAddress,
} from '../../mock-utils';
import { MicroOrmService } from '../../service';

import { CURRENT_ENTITY_MANAGER_TOKEN } from '../../constants';

import { getRelationship } from './get-relationship';

describe('get-relationship', () => {
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  let addressForTest: Addresses;
  let addresses: Addresses;
  let userGroup: UserGroups | null;
  let notes: Collection<Notes>;
  let roles: Collection<Roles>;
  let comments: Collection<Comments>;
  let userObject: Users;
  let tmpUserObject: Users | undefined = undefined;
  let newUser: Users;
  beforeAll(async () => {
    dbName = dbRandomName();
    const moduleUsers = await getModuleForPgLite(Users, dbName);
    microOrmServiceUser = moduleUsers.get<MicroOrmService<Users>>(ORM_SERVICE);
    mikroORMUsers = moduleUsers.get(MikroORM);
    em = moduleUsers.get(CURRENT_ENTITY_MANAGER_TOKEN);
    await pullData(em, 10);
  });

  beforeEach(async () => {
    const data = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .leftJoinAndSelect('Users.addresses', 'Addresses_addresses', {}, ['id'])
      .leftJoinAndSelect('Users.comments', 'Comments_comments', {}, ['id'])
      .leftJoinAndSelect('Users.roles', 'Roles__roles', {}, ['id'])
      .leftJoinAndSelect('Users.notes', 'Notes__notes', {}, ['id'])
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup', {}, ['id'])
      .where({
        addresses: {
          $exists: true,
        },
        roles: {
          $exists: true,
        },
        userGroup: {
          $exists: true,
        },
      })
      .getSingleResult();

    if (!data) throw new Error();

    ({ roles, notes, userGroup, addresses, comments, ...tmpUserObject as any } =
      data);
    userObject = tmpUserObject as any;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    newUser = {
      id: faker.number.int({ min: 0, max: 999999 }),
      firstName: firstName,
      lastName: lastName,
      isActive: faker.datatype.boolean(),
      login: faker.internet.userName({
        lastName: firstName,
        firstName: lastName,
      }),
      testReal: [faker.number.float({ fractionDigits: 4 })],
      testArrayNull: null,
      testDate: faker.date.anytime(),
    } as Users;

    addressForTest = await pullAddress();
    await em.persistAndFlush(addressForTest);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    mikroORMUsers.close(true);
  });

  it('should be ger result', async () => {
    const { addresses: addressesResult } = await getRelationship.call<
      MicroOrmService<Users, 'id'>,
      Parameters<
        typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >,
      ReturnType<typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>>
    >(microOrmServiceUser, userObject.id, 'addresses');

    expect(addressesResult.id).toBe(addresses.id);

    const { userGroup: userGroupResult } = await getRelationship.call<
      MicroOrmService<Users, 'id'>,
      Parameters<
        typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >,
      ReturnType<typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>>
    >(microOrmServiceUser, userObject.id, 'userGroup');

    expect(userGroupResult?.id).toBe(userGroup?.id);

    const { roles: rolesResult } = await getRelationship.call<
      MicroOrmService<Users, 'id'>,
      Parameters<
        typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >,
      ReturnType<typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>>
    >(microOrmServiceUser, userObject.id, 'roles');
    for (const i of roles.map((i) => i.id)) {
      expect(rolesResult.map((i) => i.id)).toContain(i);
    }
  });

  it('should be error', async () => {
    await expect(
      getRelationship.call<
        MicroOrmService<Users, 'id'>,
        Parameters<
          typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>
        >,
        ReturnType<
          typeof getRelationship<Users, 'id', RelationKeys<Users, 'id'>>
        >
      >(microOrmServiceUser, '20000', 'roles')
    ).rejects.toThrow(NotFoundException);
  });
});
