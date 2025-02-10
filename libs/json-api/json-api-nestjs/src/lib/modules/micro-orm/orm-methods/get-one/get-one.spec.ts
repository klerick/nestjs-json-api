import { EntityManager, MikroORM } from '@mikro-orm/core';

import {
  dbRandomName,
  getDefaultQuery,
  getModuleForPgLite,
  pullData,
  Users,
} from '../../../../mock-utils/microrom';
import { MicroOrmService } from '../../service';

import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  ORM_SERVICE,
} from '../../../../constants';

import { getOne } from './get-one';
import { NotFoundException } from '@nestjs/common';

describe('get-one', () => {
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  beforeAll(async () => {
    dbName = dbRandomName();
    const moduleUsers = await getModuleForPgLite(Users, dbName);
    microOrmServiceUser = moduleUsers.get<MicroOrmService<Users>>(ORM_SERVICE);
    mikroORMUsers = moduleUsers.get(MikroORM);
    em = moduleUsers.get(CURRENT_ENTITY_MANAGER_TOKEN);
    await pullData(em, 10);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    mikroORMUsers.close(true);
  });

  it('Get one item', async () => {
    const checkData = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .limit(1)
      .execute('get', true);
    const query = getDefaultQuery<Users>();

    const result = await getOne.call<
      MicroOrmService<Users>,
      Parameters<typeof getOne<Users>>,
      ReturnType<typeof getOne<Users>>
    >(microOrmServiceUser, checkData.id, query);

    expect(JSON.stringify(result)).toBe(JSON.stringify(checkData));
  });

  it('Get one item with select', async () => {
    const checkData = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .select(['id', 'firstName', 'isActive'])
      .leftJoinAndSelect('Users.addresses', 'Addresses__addresses')
      .leftJoinAndSelect('Users.comments', 'Comments__comments', {}, ['text'])
      .leftJoinAndSelect('Users.manager', 'Users__manager', {}, ['login'])
      .where({
        comments: {
          $exists: true,
        },
      })
      .limit(1)
      .execute('get', true);

    const query = getDefaultQuery<Users>();
    query.include = ['addresses', 'comments', 'manager'];
    query.fields = {
      target: ['firstName', 'isActive'],
      comments: ['text'],
      manager: ['login'],
    };
    const result = await getOne.call<
      MicroOrmService<Users>,
      Parameters<typeof getOne<Users>>,
      ReturnType<typeof getOne<Users>>
    >(microOrmServiceUser, checkData.id, query);

    expect(JSON.stringify(result)).toBe(JSON.stringify(checkData));
  });
  it('Should be error', async () => {
    expect.assertions(1);
    const query = getDefaultQuery<Users>();
    try {
      await getOne.call<
        MicroOrmService<Users>,
        Parameters<typeof getOne<Users>>,
        ReturnType<typeof getOne<Users>>
      >(microOrmServiceUser, 1000, query);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
    }
  });
});
