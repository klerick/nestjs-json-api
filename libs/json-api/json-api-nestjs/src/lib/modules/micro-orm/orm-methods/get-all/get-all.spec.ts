import { EntityManager, MikroORM } from '@mikro-orm/core';
import { faker } from '@faker-js/faker';

import {
  Addresses,
  dbRandomName,
  getDefaultQuery,
  getModuleForPgLite,
  Notes,
  pullData,
  Roles,
  UserGroups,
  Users,
} from '../../../../mock-utils/microrom';
import { MicroOrmService } from '../../service';

import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  ORM_SERVICE,
} from '../../../../constants';

import { getAll } from './get-all';

describe('get-all', () => {
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

  describe('page', () => {
    it('default', async () => {
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();

      const checkData = await queryBuilder.clone().limit(1).getResult();

      const count = await queryBuilder.clone().count();
      const query = getDefaultQuery<Users>();

      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('not default page', async () => {
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();

      const checkData = await queryBuilder.clone().limit(5, 5).getResult();
      const count = await queryBuilder.clone().count();
      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 2,
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });
  });

  describe('order', () => {
    it('sort target', async () => {
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();
      const checkData = await queryBuilder
        .clone()
        .orderBy({
          lastName: 'DESC',
        })
        .limit(5, 5)
        .getResult();
      const count = await queryBuilder.clone().count();

      const query = getDefaultQuery<Users>();
      query.sort = {
        target: {
          lastName: 'DESC',
        },
      };
      query.page = {
        size: 5,
        number: 2,
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('sort relation 1:1', async () => {
      const queryBuilder = microOrmServiceUser.microOrmUtilService
        .queryBuilder()
        .select(['id', 'login', 'firstName', 'lastName'])
        .leftJoinAndSelect('Users.addresses', 'Addresses__addresses', {}, [
          'state',
        ]);

      const checkData = await queryBuilder
        .clone()
        .orderBy({
          addresses: {
            state: 'ASC',
            id: 'ASC',
          },
        })
        .limit(5, 5)
        .getResult();

      const count = await queryBuilder.clone().count();

      const query = getDefaultQuery<Users>();
      query.fields = {
        target: ['login', 'firstName', 'lastName'],
        addresses: ['state'],
      };

      query.sort = {
        addresses: {
          state: 'ASC',
          id: 'ASC',
        },
      };
      query.page = {
        size: 5,
        number: 2,
      };

      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('sort relation m:m', async () => {
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();
      const checkData = await queryBuilder
        .clone()
        .orderBy({
          roles: {
            name: 'DESC',
          },
          id: 'ASC',
        })
        .limit(5, 5)
        .getResult();

      const count = await queryBuilder
        .clone()
        .leftJoin('Users.roles', 'Roles__roles')
        .distinct()
        .count();

      const query = getDefaultQuery<Users>();
      query.sort = {
        roles: {
          name: 'DESC',
        },
      };
      query.page = {
        size: 5,
        number: 2,
      };

      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });
  });

  describe('select', () => {
    it('default', async () => {
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();
      const checkData = await queryBuilder.clone().limit(5).getResult();
      const count = await queryBuilder.clone().count();
      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 1,
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('target select field', async () => {
      const select: ['login', 'firstName', 'lastName'] = [
        'login',
        'firstName',
        'lastName',
      ];
      const queryBuilder =
        microOrmServiceUser.microOrmUtilService.queryBuilder();
      const checkData = await queryBuilder
        .clone()
        .select(['id', ...select])
        .limit(5)
        .getResult();
      const count = await queryBuilder.clone().count();
      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 1,
      };
      query.fields = {
        target: select,
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('relation select field', async () => {
      const select: ['login', 'firstName', 'lastName'] = [
        'login',
        'firstName',
        'lastName',
      ];
      const queryBuilder = microOrmServiceUser.microOrmUtilService
        .queryBuilder('Users')
        .select(['id', ...select])
        .leftJoinAndSelect('Users.addresses', 'Addresses_addresses', {}, [
          'city',
          'state',
        ])
        .leftJoinAndSelect('Users.roles', 'Roles__roles', {}, ['name', 'key']);
      const checkData = await queryBuilder.clone().limit(5).getResult();
      const count = await queryBuilder.clone().count().distinct();
      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 1,
      };
      query.fields = {
        target: select,
        addresses: ['city', 'state'],
        roles: ['name', 'key'],
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });
  });

  describe('include', () => {
    it('default', async () => {
      const queryBuilder = microOrmServiceUser.microOrmUtilService
        .queryBuilder('Users')
        .leftJoinAndSelect('Users.roles', 'Roles__roles');

      const checkData = await queryBuilder.clone().limit(5).getResult();
      const count = await queryBuilder.clone().count().distinct();

      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 1,
      };
      query.include = ['roles'];

      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });

    it('include with select', async () => {
      const queryBuilder = microOrmServiceUser.microOrmUtilService
        .queryBuilder('Users')
        .leftJoinAndSelect('Users.roles', 'Roles__roles')
        .leftJoinAndSelect('Users.addresses', 'Addresses__addresses', {}, [
          'city',
          'state',
        ]);

      const checkData = await queryBuilder.clone().limit(5).getResult();
      const count = await queryBuilder.clone().count().distinct();

      const query = getDefaultQuery<Users>();
      query.page = {
        size: 5,
        number: 1,
      };
      query.include = ['roles'];
      query.fields = {
        addresses: ['city', 'state'],
      };
      const { totalItems, items } = await getAll.call<
        MicroOrmService<Users>,
        Parameters<typeof getAll<Users>>,
        ReturnType<typeof getAll<Users>>
      >(microOrmServiceUser, query);

      expect(totalItems).toBe(count);
      expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
    });
  });

  describe('filter', () => {
    let rolesData: Roles[];
    let addresses: Addresses[];
    let userGroups: UserGroups[];
    let users: Users[];
    let notes: Notes[];
    beforeAll(async () => {
      rolesData = await microOrmServiceUser.microOrmUtilService
        .queryBuilder(Roles)
        .getResult();
      addresses = await microOrmServiceUser.microOrmUtilService
        .queryBuilder(Addresses)
        .getResult();

      userGroups = await microOrmServiceUser.microOrmUtilService
        .queryBuilder(UserGroups)
        .getResult();
      users = await microOrmServiceUser.microOrmUtilService
        .queryBuilder()
        .getResult();
      notes = await microOrmServiceUser.microOrmUtilService
        .queryBuilder(Notes)
        .getResult();
    });

    describe('target', () => {
      it('simple filter on target', async () => {
        const randUsers = faker.helpers.arrayElements(users);
        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            login: {
              $in: randUsers.map((i) => i.login),
            },
          });

        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            login: 'DESC',
          })
          .getResult();
        const count = await queryBuilder.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          target: {
            login: {
              in: randUsers.map((i) => i.login) as [string, ...string[]],
            },
          },
        };
        query.sort = {
          target: {
            login: 'DESC',
          },
        };
        const { totalItems, items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
      });

      it('Target relation is null 1:1', async () => {
        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            manager: {
              $exists: false,
            },
          });

        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            manager: {
              login: 'DESC',
            },
          })
          .getResult();
        const count = await queryBuilder.clone().count();

        const queryBuilder2 = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            addresses: {
              $exists: true,
            },
          });

        const checkData2 = await queryBuilder2
          .clone()
          .limit(5)
          .orderBy({
            addresses: {
              city: 'DESC',
            },
          })
          .getResult();
        const count2 = await queryBuilder2.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          target: {
            manager: {
              eq: 'null',
            },
          },
        };
        query.sort = {
          manager: {
            login: 'DESC',
          },
        };

        const query2 = getDefaultQuery<Users>();
        query2.page = {
          size: 5,
          number: 1,
        };
        query2.filter = {
          target: {
            addresses: {
              ne: 'null',
            },
          },
        };
        query2.sort = {
          addresses: {
            city: 'DESC',
          },
        };
        const { totalItems, items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));

        const { totalItems: totalItems2, items: items2 } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query2);

        expect(totalItems2).toBe(count2);
        expect(JSON.stringify(items2)).toBe(JSON.stringify(checkData2));
      });

      it('Target relation is null m:1 & 1:m', async () => {
        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            userGroup: {
              $exists: false,
            },
          });

        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            login: 'DESC',
          })
          .getResult();
        const count = await queryBuilder.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          target: {
            userGroup: {
              eq: 'null',
            },
          },
        };
        query.sort = {
          target: {
            login: 'DESC',
          },
        };

        const { totalItems, items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));

        const checkData2 = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            userGroup: {
              label: 'DESC',
            },
          })
          .getResult();

        const count2 = await queryBuilder.clone().count();

        const query2 = getDefaultQuery<Users>();
        query2.page = {
          size: 5,
          number: 1,
        };
        query2.filter = {
          target: {
            userGroup: {
              eq: 'null',
            },
          },
        };
        query2.sort = {
          userGroup: {
            label: 'DESC',
          },
        };

        const { totalItems: totalItems2, items: items2 } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query2);

        expect(totalItems2).toBe(count2);
        expect(JSON.stringify(items2)).toBe(JSON.stringify(checkData2));

        const queryBuilder2 = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            notes: {
              $exists: true,
            },
          });
        const checkData3 = await queryBuilder2
          .clone()
          .limit(5)
          .orderBy({
            notes: {
              id: 'DESC',
            },
          })
          .getResult();

        const count3 = await queryBuilder2.clone().count().distinct();

        const query3 = getDefaultQuery<Users>();
        query3.page = {
          size: 5,
          number: 1,
        };
        query3.filter = {
          target: {
            notes: {
              ne: 'null',
            },
          },
        };
        query3.sort = {
          notes: {
            id: 'DESC',
          },
        };

        const { totalItems: totalItems3, items: items3 } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query3);
        expect(totalItems3).toBe(count3);
        expect(JSON.stringify(items3)).toBe(JSON.stringify(checkData3));

        const checkData4 = await queryBuilder2
          .clone()
          .limit(5)
          .orderBy({ id: 'DESC' })
          .getResult();
        const count4 = await queryBuilder2.clone().count().distinct();

        const query4 = getDefaultQuery<Users>();
        query4.page = {
          size: 5,
          number: 1,
        };
        query4.filter = {
          target: {
            notes: {
              ne: 'null',
            },
          },
        };
        query4.sort = {
          target: {
            id: 'DESC',
          },
        };

        const { totalItems: totalItems4, items: items4 } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query4);
        expect(totalItems4).toBe(count4);
        expect(JSON.stringify(items4)).toBe(JSON.stringify(checkData4));
      });

      it('Target relation is null m:m', async () => {
        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            roles: {
              $exists: false,
            },
          });
        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            manager: {
              login: 'DESC',
            },
          })
          .getResult();

        const count = await queryBuilder.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          target: {
            roles: {
              eq: 'null',
            },
          },
        };
        query.sort = {
          manager: {
            login: 'DESC',
          },
        };
        const { totalItems: totalItems, items: items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));

        const queryBuilder1 = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            roles: {
              $exists: true,
            },
          });

        const checkData1 = await queryBuilder1
          .clone()
          .limit(5)
          .orderBy({
            roles: {
              key: 'DESC',
            },
          })
          .getResult();

        const count1 = await queryBuilder1.clone().count().distinct();

        const query1 = getDefaultQuery<Users>();
        query1.page = {
          size: 5,
          number: 1,
        };
        query1.filter = {
          target: {
            roles: {
              ne: 'null',
            },
          },
        };
        query1.sort = {
          roles: {
            key: 'DESC',
          },
        };
        const { totalItems: totalItems1, items: items1 } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query1);

        expect(totalItems1).toBe(count1);
        expect(JSON.stringify(items1)).toBe(JSON.stringify(checkData1));
      });
    });

    describe('relation', () => {
      it('relation 1:1', async () => {
        const randAddresses = faker.helpers.arrayElements(addresses);

        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .where({
            addresses: {
              id: {
                $in: randAddresses.map((i) => i.id),
              },
            },
          })
          .joinAndSelect('Users.addresses', 'Addresses');

        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            addresses: {
              city: 'DESC',
            },
          })
          .getResult();

        const count = await queryBuilder.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          relation: {
            addresses: {
              id: {
                in: randAddresses.map((i) => `${i.id}`) as [
                  string,
                  ...string[]
                ],
              },
            },
          },
        };
        query.sort = {
          addresses: {
            city: 'DESC',
          },
        };
        query.include = ['addresses'];
        const { totalItems: totalItems, items: items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
      });

      it('relation 1:m', async () => {
        const randNotes = faker.helpers.arrayElements(notes, 3);

        const quweryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .leftJoinAndSelect('Users.notes', 'Notes', {
            id: { $in: randNotes.map((i) => i.id) },
          })
          .where({
            notes: {
              id: {
                $in: randNotes.map((i) => i.id),
              },
            },
          });
        const checkData = await quweryBuilder
          .clone()
          .limit(5)
          .orderBy({
            addresses: {
              city: 'DESC',
            },
          })
          .getResult();
        const count = await quweryBuilder.clone().count();
        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          relation: {
            notes: {
              id: {
                in: randNotes.map((i) => `${i.id}`) as [string, ...string[]],
              },
            },
          },
        };
        query.sort = {
          addresses: {
            city: 'DESC',
          },
        };
        query.include = ['notes'];
        const { totalItems: totalItems, items: items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
      });

      it('relation m:m', async () => {
        const randRoles = faker.helpers.arrayElements(rolesData, 3);

        const queryBuilder = microOrmServiceUser.microOrmUtilService
          .queryBuilder('Users')
          .leftJoinAndSelect('Users.roles', 'Roles__roles', {
            key: randRoles[0].key,
          })
          .where({
            roles: {
              key: {
                $eq: randRoles[0].key,
              },
            },
          });
        const checkData = await queryBuilder
          .clone()
          .limit(5)
          .orderBy({
            addresses: {
              city: 'DESC',
            },
          })
          .getResult();

        const count = await queryBuilder.clone().count();

        const query = getDefaultQuery<Users>();
        query.page = {
          size: 5,
          number: 1,
        };
        query.filter = {
          relation: {
            roles: {
              key: {
                eq: `${randRoles[0].key}`,
              },
            },
          },
        };
        query.sort = {
          addresses: {
            city: 'DESC',
          },
        };

        query.include = ['roles'];

        const { totalItems: totalItems, items: items } = await getAll.call<
          MicroOrmService<Users>,
          Parameters<typeof getAll<Users>>,
          ReturnType<typeof getAll<Users>>
        >(microOrmServiceUser, query);

        expect(totalItems).toBe(count);
        expect(JSON.stringify(items)).toBe(JSON.stringify(checkData));
      });
    });
  });
});
