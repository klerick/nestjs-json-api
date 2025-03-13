import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';
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

import { patchRelationship } from './patch-relationship';

describe('patch-relationship', () => {
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  let addressForTest: Addresses;
  let addresses: Addresses;
  let userGroup: UserGroups[];
  let notes: Collection<Notes>;
  let roles: Roles[];
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
    userObject = (await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .limit(1)
      .getSingleResult()) as Users;

    roles = await microOrmServiceUser.microOrmUtilService
      .queryBuilder(Roles)
      .getResult();

    userGroup = await microOrmServiceUser.microOrmUtilService
      .queryBuilder(UserGroups)
      .getResult();

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

  it('should be ok', async () => {
    const roles1 = faker.helpers.arrayElement(roles);
    const roles2 = faker.helpers.arrayElement(roles);
    const roles3 = faker.helpers.arrayElement(roles);
    const userGroup1 = faker.helpers.arrayElement(userGroup);
    const saveIdUserGroup = userGroup1.id;
    await patchRelationship.call<
      MicroOrmService<Users, 'id'>,
      Parameters<
        typeof patchRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >,
      ReturnType<
        typeof patchRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >
    >(microOrmServiceUser, userObject.id, 'roles', [
      { type: 'roles', id: roles1.id.toString() },
      { type: 'roles', id: roles2.id.toString() },
      { type: 'roles', id: roles3.id.toString() },
    ]);

    await patchRelationship.call<
      MicroOrmService<Users, 'id'>,
      Parameters<
        typeof patchRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >,
      ReturnType<
        typeof patchRelationship<Users, 'id', RelationKeys<Users, 'id'>>
      >
    >(microOrmServiceUser, userObject.id, 'userGroup', {
      type: 'user-groups',
      id: saveIdUserGroup.toString(),
    });

    const checkData = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .leftJoinAndSelect('Users.roles', 'Roles__roles', {}, ['id'])
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup', {}, ['id'])
      .where({
        id: userObject.id,
      })
      .getSingleResult();

    expect(checkData?.roles.map((i) => i.id)).toEqual(
      expect.arrayContaining([roles1.id, roles2.id, roles3.id])
    );

    expect(checkData?.roles.map((i) => i.id)).toHaveLength(
      [roles1.id, roles2.id, roles3.id].length
    );
    expect(checkData?.userGroup?.id).toBe(saveIdUserGroup);
  });
});
