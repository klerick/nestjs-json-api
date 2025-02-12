import { EntityManager, MikroORM } from '@mikro-orm/core';

import {
  dbRandomName,
  getModuleForPgLite,
  pullData,
  Users,
} from '../../../../mock-utils/microrom';
import { MicroOrmService } from '../../service';

import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  ORM_SERVICE,
} from '../../../../constants';
import { deleteOne } from './delete-one';

describe('delete-one', () => {
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

  it('Delete one item', async () => {
    const checkData = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .limit(1)
      .execute('get', true);

    await deleteOne.call<
      MicroOrmService<Users>,
      Parameters<typeof deleteOne<Users>>,
      ReturnType<typeof deleteOne<Users>>
    >(microOrmServiceUser, checkData.id);

    const result = await microOrmServiceUser.microOrmUtilService
      .queryBuilder()
      .where({
        id: checkData.id,
      })
      .execute('get', true);

    expect(result).toBe(null);
  });
});
