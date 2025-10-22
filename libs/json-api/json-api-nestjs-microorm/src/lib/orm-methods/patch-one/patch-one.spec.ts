import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';
import { ORM_SERVICE, PatchData } from '@klerick/json-api-nestjs';

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

import { patchOne } from './patch-one';

import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('patch-one', () => {
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  let addresses: Addresses;
  let addressForTest: Addresses;
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
        notes: {
          $exists: true,
        },
        userGroup: {
          $exists: true,
        },
        comments: {
          $exists: true,
        },
      })
      .limit(1)
      .execute('get', true);

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
      login: faker.internet.username({
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

  it('should be update attr', async () => {
    const {
      id,
      manager: mewManager,
      userGroup: newUserGroup,
      addresses: newAddresses,
      comments: newComments,
      notes: newNotes,
      roles: newRoles,
      ...otherAttr
    } = newUser;

    const result = await patchOne.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof patchOne<Users, 'id'>>,
      ReturnType<typeof patchOne<Users, 'id'>>
    >(microOrmServiceUser, userObject.id, {
      id: userObject.id.toString(),
      attributes: otherAttr,
      type: 'users',
    });

    const fromDb = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: userObject.id,
      })
      .leftJoinAndSelect('Users.addresses', 'Addresses_addresses')
      .leftJoinAndSelect('Users.comments', 'Comments_comments')
      .leftJoinAndSelect('Users.roles', 'Roles__roles')
      .leftJoinAndSelect('Users.notes', 'Notes__notes')
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup')
      .limit(1)
      .getSingleResult();

    expect(result).toEqual(fromDb);
  });

  it('should be update relation', async () => {
    const {
      id,
      manager: mewManager,
      userGroup: newUserGroup,
      addresses: newAddresses,
      comments: newComments,
      notes: newNotes,
      roles: newRoles,
      ...otherAttr
    } = newUser;

    const setRoles = await microOrmServiceUser.microOrmUtilService
      .queryBuilder(Roles)
      .limit(2, 5)
      .getResult();

    const patchData = {
      id: userObject.id.toString(),
      attributes: otherAttr,
      type: 'users',
      relationships: {
        addresses: {
          data: {
            id: addressForTest.id.toString(),
            type: 'addresses',
          },
        },
        comments: {
          data: [],
        },
        userGroup: {
          data: null,
        },
        roles: {
          data: setRoles.map((i) => ({ id: i.id.toString(), type: 'roles' })),
        },
      },
    } satisfies PatchData<Users, 'id'>;

    const result = await patchOne.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof patchOne<Users, 'id'>>,
      ReturnType<typeof patchOne<Users, 'id'>>
    >(microOrmServiceUser, userObject.id, patchData as any);

    const fromDb = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: userObject.id,
      })
      .leftJoinAndSelect('Users.addresses', 'Addresses_addresses')
      .leftJoinAndSelect('Users.comments', 'Comments_comments')
      .leftJoinAndSelect('Users.roles', 'Roles__roles')
      .leftJoinAndSelect('Users.notes', 'Notes__notes')
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup')
      .limit(1)
      .getSingleResult();

    expect(result).toEqual(fromDb);
  });

  it('should be error', async () => {
    await expect(
      patchOne.call<
        MicroOrmService<Users, 'id'>,
        Parameters<typeof patchOne<Users, 'id'>>,
        ReturnType<typeof patchOne<Users, 'id'>>
      >(microOrmServiceUser, 1, {
        attributes: {},
        type: 'users',
      } as any)
    ).rejects.toThrow(UnprocessableEntityException);

    await expect(
      patchOne.call<
        MicroOrmService<Users, 'id'>,
        Parameters<typeof patchOne<Users, 'id'>>,
        ReturnType<typeof patchOne<Users, 'id'>>
      >(microOrmServiceUser, 10000, {
        id: '10000',
        attributes: {} as any,
        type: 'users',
      })
    ).rejects.toThrow(NotFoundException);
  });
});
