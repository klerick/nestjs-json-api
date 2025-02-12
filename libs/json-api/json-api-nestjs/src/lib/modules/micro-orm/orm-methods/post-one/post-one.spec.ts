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

import { postOne } from './post-one';
import { BadRequestException } from '@nestjs/common';

describe('post-one', () => {
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

  it('simple create', async () => {
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

    const result = await postOne.call<
      MicroOrmService<Users>,
      Parameters<typeof postOne<Users>>,
      ReturnType<typeof postOne<Users>>
    >(microOrmServiceUser, {
      attributes: otherAttr,
      type: 'users',
    });

    const { id: newId } = result;

    const fromDb = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: newId,
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

  it('simple create withId', async () => {
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

    const result = await postOne.call<
      MicroOrmService<Users>,
      Parameters<typeof postOne<Users>>,
      ReturnType<typeof postOne<Users>>
    >(microOrmServiceUser, {
      id: id.toString(),
      attributes: otherAttr,
      type: 'users',
    });

    const { id: newId } = result;

    const fromDb = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: newId,
      })
      .leftJoinAndSelect('Users.addresses', 'Addresses_addresses')
      .leftJoinAndSelect('Users.comments', 'Comments_comments')
      .leftJoinAndSelect('Users.roles', 'Roles__roles')
      .leftJoinAndSelect('Users.notes', 'Notes__notes')
      .leftJoinAndSelect('Users.userGroup', 'UserGroups__userGroup')
      .limit(1)
      .getSingleResult();

    expect(newId).toBe(id.toString());
    expect(result).toEqual(fromDb);
  });

  it('create with relation', async () => {
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

    const result = await postOne.call<
      MicroOrmService<Users>,
      Parameters<typeof postOne<Users>>,
      ReturnType<typeof postOne<Users>>
    >(microOrmServiceUser, {
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
          data: comments.map((i) => ({
            id: i.id.toString(),
            type: 'comments',
          })),
        },
        roles: {
          data: roles.map((i) => ({
            id: i.id.toString(),
            type: 'roles',
          })),
        },
        notes: {
          data: notes.map((i) => ({
            id: i.id.toString(),
            type: 'notes',
          })),
        },
        userGroup: {
          data: {
            id: userGroup.id.toString(),
            type: 'user-groups',
          },
        },
        manager: {
          data: {
            id: userObject.id.toString(),
            type: 'users',
          },
        },
      },
    });

    const { id: newId } = result;

    const fromDb = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: newId,
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

    await expect(
      postOne.call<
        MicroOrmService<Users>,
        Parameters<typeof postOne<Users>>,
        ReturnType<typeof postOne<Users>>
      >(microOrmServiceUser, {
        attributes: otherAttr,
        type: 'users',
        relationships: {
          addresses: {
            data: {
              id: '999999',
              type: 'addresses',
            },
          },
        },
      })
    ).rejects.toThrow(BadRequestException);

    await expect(
      postOne.call<
        MicroOrmService<Users>,
        Parameters<typeof postOne<Users>>,
        ReturnType<typeof postOne<Users>>
      >(microOrmServiceUser, {
        attributes: otherAttr,
        type: 'users',
        relationships: {
          roles: {
            data: [
              {
                id: '999999',
                type: 'addresses',
              },
            ],
          },
        },
      })
    ).rejects.toThrow(BadRequestException);

    await expect(
      postOne.call<
        MicroOrmService<Users>,
        Parameters<typeof postOne<Users>>,
        ReturnType<typeof postOne<Users>>
      >(microOrmServiceUser, {
        attributes: otherAttr,
        type: 'users',
        relationships: {
          // @ts-expect-error check run time error
          incorrectRel: {
            data: [
              {
                id: '999999',
                type: 'addresses',
              },
            ],
          },
        },
      })
    ).rejects.toThrow(BadRequestException);
  });
});
