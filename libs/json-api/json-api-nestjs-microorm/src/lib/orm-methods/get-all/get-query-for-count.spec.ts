import { EntityManager, MikroORM } from '@mikro-orm/core';
import { FilterOperand } from '@klerick/json-api-nestjs-shared';
import { ORM_SERVICE } from '@klerick/json-api-nestjs';
import {
  UserGroups,
  Users,
  pullAllData,
  getDefaultQuery,
  dbRandomName,
  getModuleForPgLite,
} from '../../mock-utils';

import { CURRENT_ENTITY_MANAGER_TOKEN } from '../../constants';

import { getQueryForCount } from './get-query-for-count';
import { MicroOrmService } from '../../service';

describe('get-query-for-count', () => {
  let mikroORMUserGroup: MikroORM;
  let mikroORMUsers: MikroORM;
  let microOrmServiceUser: MicroOrmService<Users>;
  let em: EntityManager;
  let dbName: string;
  beforeAll(async () => {
    dbName = dbRandomName(true);
    const moduleUserGroup = await getModuleForPgLite(UserGroups, dbName);

    mikroORMUserGroup = moduleUserGroup.get(MikroORM);

    const moduleUsers = await getModuleForPgLite(Users, dbName);
    microOrmServiceUser = moduleUsers.get<MicroOrmService<Users>>(ORM_SERVICE);
    mikroORMUsers = moduleUsers.get(MikroORM);
    em = moduleUserGroup.get(CURRENT_ENTITY_MANAGER_TOKEN);
    await pullAllData(em);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    mikroORMUserGroup.close(true);
    mikroORMUsers.close(true);
  });

  it('has only sort data', () => {
    const query = getDefaultQuery<Users>();
    query.sort = {
      target: {
        id: 'ASC',
        lastName: 'DESC',
      },
      userGroup: {
        id: 'ASC',
      },
      roles: {
        name: 'DESC',
      },
    };

    const result = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query]);

    expect(result.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" left join "public"."users_have_roles" as "u2" on "Users"."id" = "u2"."user_id" left join "public"."roles" as "u1" on "u2"."role_id" = "u1"."id" order by "Users"."id" asc, "Users"."last_name" desc, "Users"."user_groups_id" asc, "u1"."name" desc`
    );
  });

  it('has only filter data', () => {
    const query = getDefaultQuery<Users>();
    query.filter = {
      target: {
        login: {
          [FilterOperand.eq]: 'test',
          [FilterOperand.ne]: 'test2',
        },
        isActive: {
          [FilterOperand.eq]: 'false',
        },
        testReal: {
          [FilterOperand.some]: ['test'],
        },
      },
    } as any;

    const query1 = getDefaultQuery<Users>();
    query1.filter = {
      target: {
        login: {
          [FilterOperand.eq]: 'test',
          [FilterOperand.ne]: 'test2',
        },
        isActive: {
          [FilterOperand.eq]: 'false',
        },
      },
      relation: {
        comments: {
          kind: {
            [FilterOperand.eq]: 'COMMENT',
          },
        },
        userGroup: {
          label: {
            [FilterOperand.eq]: 'test',
          },
        },
      },
    } as any;

    const query2 = getDefaultQuery<Users>();
    query2.filter = {
      target: {
        login: {
          [FilterOperand.eq]: 'test',
          [FilterOperand.ne]: 'test2',
        },
        isActive: {
          [FilterOperand.eq]: 'false',
        },
      },
      relation: {
        manager: {
          login: {
            [FilterOperand.eq]: 'test',
          },
        },
        addresses: {
          city: {
            [FilterOperand.eq]: 'test',
          },
        },
      },
    } as any;

    const query3 = getDefaultQuery<Users>();
    query3.filter = {
      target: {
        login: {
          [FilterOperand.eq]: 'test',
          [FilterOperand.ne]: 'test2',
        },
        isActive: {
          [FilterOperand.eq]: 'false',
        },
      },
      relation: {
        roles: {
          key: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isDefault: {
            [FilterOperand.eq]: 'false',
          },
        },
      },
    };

    const result = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query]);

    expect(result.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" where "Users"."login" = 'test' and "Users"."login" != 'test2' and "Users"."is_active" = 'false' and "Users"."test_real" && '{test}' order by "Users"."id" asc`
    );

    const result1 = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query1]);

    expect(result1.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" where "Users"."login" = 'test' and "Users"."login" != 'test2' and "Users"."is_active" = 'false' and (exists (select 1 from "public"."comments" as "Comments" where "Comments"."created_by" = "Users"."id" and "Comments"."kind" = 'COMMENT')) and (exists (select 1 from "public"."user_groups" as "UserGroups" where "UserGroups"."id" = "Users"."user_groups_id" and "UserGroups"."label" = 'test')) order by "Users"."id" asc`
    );

    const result2 = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query2]);
    expect(result2.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" left join "public"."users" as "u1" on "Users"."manager_id" = "u1"."id" left join "public"."addresses" as "a2" on "Users"."addresses_id" = "a2"."id" where "Users"."login" = 'test' and "Users"."login" != 'test2' and "Users"."is_active" = 'false' and "u1"."login" = 'test' and "a2"."city" = 'test' order by "Users"."id" asc`
    );

    const result3 = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query3]);
    expect(result3.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" where "Users"."login" = 'test' and "Users"."login" != 'test2' and "Users"."is_active" = 'false' and (exists (select 1 from "public"."users_have_roles" as "users_have_roles" left join "public"."roles" as "r1" on "users_have_roles"."role_id" = "r1"."id" where "users_have_roles"."user_id" = "Users"."id" and "r1"."key" = 'test' and "r1"."key" != 'test2' and "r1"."is_default" = 'false')) order by "Users"."id" asc`
    );
  });

  it('has only filter data with sort', () => {
    const query1 = getDefaultQuery<Users>();
    query1.filter = {
      relation: {
        roles: {
          key: {
            [FilterOperand.eq]: 'test',
            [FilterOperand.ne]: 'test2',
          },
          isDefault: {
            [FilterOperand.eq]: 'false',
          },
        },
      },
    };
    query1.sort = {
      target: {
        id: 'ASC',
        lastName: 'DESC',
      },
      userGroup: {
        id: 'ASC',
      },
      roles: {
        name: 'DESC',
      },
    };

    const result1 = getQueryForCount.call<
      MicroOrmService<Users, 'id'>,
      Parameters<typeof getQueryForCount<Users, 'id'>>,
      ReturnType<typeof getQueryForCount<Users, 'id'>>
    >(microOrmServiceUser, ...[query1]);
    expect(result1.getFormattedQuery()).toBe(
      `select "Users".* from "public"."users" as "Users" left join "public"."users_have_roles" as "u2" on "Users"."id" = "u2"."user_id" left join "public"."roles" as "u1" on "u2"."role_id" = "u1"."id" where "u1"."key" = 'test' and "u1"."key" != 'test2' and "u1"."is_default" = 'false' order by "Users"."id" asc, "Users"."last_name" desc, "Users"."user_groups_id" asc, "u1"."name" desc`
    );
  });
});
