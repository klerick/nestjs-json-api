import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ORM_SERVICE } from '@klerick/json-api-nestjs';
import {
  dbRandomName,
  getModuleForPgLite,
  pullData,
  Users,
} from '../../mock-utils';
import { MicroOrmService } from '../../service';

import { CURRENT_ENTITY_MANAGER_TOKEN } from '../../constants';
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
    vi.clearAllMocks();
    vi.restoreAllMocks();
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
      MicroOrmService<Users, 'id'>,
      Parameters<typeof deleteOne<Users, 'id'>>,
      ReturnType<typeof deleteOne<Users, 'id'>>
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
