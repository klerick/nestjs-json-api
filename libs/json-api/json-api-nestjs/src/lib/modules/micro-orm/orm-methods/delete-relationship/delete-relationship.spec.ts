import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
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

import { deleteRelationship } from './delete-relationship';
import { BadRequestException } from '@nestjs/common';
import { EntityRelation } from '@klerick/json-api-nestjs-shared';

describe('delete-relationship', () => {
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
        roles: {
          $exists: true,
        },
        userGroup: {
          $exists: true,
        },
      })
      .limit(1)
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

  it('should be ok', async () => {
    const saveCount = roles.length;
    const [roles1, roles2] = roles;
    await deleteRelationship.call<
      MicroOrmService<Users>,
      Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
      ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
    >(microOrmServiceUser, userObject.id, 'roles', [
      { type: 'roles', id: roles1.id.toString() },
    ]);

    await deleteRelationship.call<
      MicroOrmService<Users>,
      Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
      ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
    >(microOrmServiceUser, userObject.id, 'userGroup', {
      type: 'user-groups',
      id: userGroup.id.toString(),
    });

    const checkData = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .leftJoinAndSelect('Users.roles', 'Roles__roles', {}, ['id'])
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup', {}, ['id'])
      .where({
        id: userObject.id,
      })
      .getSingleResult();

    expect(checkData?.roles.length).toBe(saveCount - 1);
    expect(checkData?.roles.map((i) => i.id)).not.toContain(roles1.id);
    expect(checkData?.userGroup).toBe(null);
  });

  it('should be error', async () => {
    await expect(
      deleteRelationship.call<
        MicroOrmService<Users>,
        Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
        ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
      >(microOrmServiceUser, userObject.id, 'roles', {
        type: 'roles',
        id: '1000',
      })
    ).rejects.toThrow();

    await expect(
      deleteRelationship.call<
        MicroOrmService<Users>,
        Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
        ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
      >(microOrmServiceUser, userObject.id, 'roles', [
        {
          type: 'roles',
          id: '1000',
        },
      ])
    ).rejects.toThrow();

    await expect(
      deleteRelationship.call<
        MicroOrmService<Users>,
        Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
        ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
      >(microOrmServiceUser, userObject.id, 'userGroup', [
        {
          type: 'user-groups',
          id: '10000',
        },
      ])
    ).rejects.toThrow();
    await expect(
      deleteRelationship.call<
        MicroOrmService<Users>,
        Parameters<typeof deleteRelationship<Users, EntityRelation<Users>>>,
        ReturnType<typeof deleteRelationship<Users, EntityRelation<Users>>>
      >(microOrmServiceUser, userObject.id, 'userGroup', {
        type: 'user-groups',
        id: '10000',
      })
    ).rejects.toThrow();
  });
});
