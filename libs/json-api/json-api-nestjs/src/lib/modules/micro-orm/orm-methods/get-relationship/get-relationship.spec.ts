import {
  Collection,
  EntityManager,
  MikroORM,
  NotFoundError,
} from '@mikro-orm/core';
import { faker } from '@faker-js/faker';

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
} from '../../../../mock-utils/microrom';
import { MicroOrmService } from '../../service';

import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  ORM_SERVICE,
} from '../../../../constants';

import { getRelationship } from './get-relationship';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityRelation } from '@klerick/json-api-nestjs-shared';

describe('get-relationship', () => {
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  let addressForTest: Addresses;
  let addresses: Addresses;
  let userGroup: UserGroups;
  let notes: Collection<Notes>;
  let roles: Collection<Roles>;
  let comments: Collection<Comments>;
  let userObject: Users;
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

    ({ roles, notes, userGroup, addresses, comments, ...userObject as any } =
      data);
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
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    mikroORMUsers.close(true);
  });

  it('should be ger result', async () => {
    const { addresses: addressesResult } = await getRelationship.call<
      MicroOrmService<Users>,
      Parameters<typeof getRelationship<Users, EntityRelation<Users>>>,
      ReturnType<typeof getRelationship<Users, EntityRelation<Users>>>
    >(microOrmServiceUser, userObject.id, 'addresses');

    expect(addressesResult.id).toBe(addresses.id);

    const { userGroup: userGroupResult } = await getRelationship.call<
      MicroOrmService<Users>,
      Parameters<typeof getRelationship<Users, EntityRelation<Users>>>,
      ReturnType<typeof getRelationship<Users, EntityRelation<Users>>>
    >(microOrmServiceUser, userObject.id, 'userGroup');

    expect(userGroupResult.id).toBe(userGroup.id);

    const { roles: rolesResult } = await getRelationship.call<
      MicroOrmService<Users>,
      Parameters<typeof getRelationship<Users, EntityRelation<Users>>>,
      ReturnType<typeof getRelationship<Users, EntityRelation<Users>>>
    >(microOrmServiceUser, userObject.id, 'roles');
    for (const i of roles.map((i) => i.id)) {
      expect(rolesResult.map((i) => i.id)).toContain(i);
    }
  });

  it('should be error', async () => {
    await expect(
      getRelationship.call<
        MicroOrmService<Users>,
        Parameters<typeof getRelationship<Users, EntityRelation<Users>>>,
        ReturnType<typeof getRelationship<Users, EntityRelation<Users>>>
      >(microOrmServiceUser, '20000', 'roles')
    ).rejects.toThrow(NotFoundException);
  });
});
