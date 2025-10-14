import { TestingModule } from '@nestjs/testing';
import { PostRelationshipData, Query } from '@klerick/json-api-nestjs';
import { QueryField, FilterOperand } from '@klerick/json-api-nestjs-shared';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Repository } from 'typeorm';

import {
  UserGroups,
  Users,
  Comments,
  Roles,
  Addresses,
  Notes,
  dbRandomName,
  getModuleForPgLite,
  getRepository,
  pullAllData,
} from '../mock-utils';

import { CURRENT_ENTITY_REPOSITORY } from '../constants';
import { TypeormUtilsService } from './typeorm-utils.service';
import { EXPRESSION, OperandsMapExpression } from '../type';

function getDefaultQuery<R extends object, IdKey extends string = 'id'>() {
  const filter = {
    relation: null,
    target: null,
  };
  const defaultQuery = {
    [QueryField.filter]: filter,
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: 1,
      number: 1,
    },
  } as Query<R, IdKey>;

  return defaultQuery;
}

describe('TypeormUtilsService', () => {
  const dbName = dbRandomName();
  let typeormUtilsServiceUserGroups: TypeormUtilsService<UserGroups>;
  let repositoryUserGroups: Repository<UserGroups>;

  let typeormUtilsServiceUser: TypeormUtilsService<Users>;
  let repositoryUser: Repository<Users>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  function getQuery() {
    return repositoryUser
      .createQueryBuilder()
      .subQuery()
      .select('Users-Roles.user_id')
      .from('users_have_roles', 'Users-Roles')
      .leftJoin(
        Roles,
        'Users__Roles_roles',
        'Users-Roles.role_id = Users__Roles_roles.id'
      );
  }

  beforeAll(async () => {
    dbRandomName();
    const module: TestingModule = await getModuleForPgLite(
      UserGroups,
      dbName,
      TypeormUtilsService
    );

    typeormUtilsServiceUserGroups =
      module.get<TypeormUtilsService<UserGroups>>(TypeormUtilsService);
    repositoryUserGroups = module.get<Repository<UserGroups>>(
      CURRENT_ENTITY_REPOSITORY
    );

    const moduleUsers: TestingModule = await getModuleForPgLite(
      Users,
      dbName,
      TypeormUtilsService
    );

    ({
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository,
    } = getRepository(module));
    await pullAllData(
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository
    );

    typeormUtilsServiceUser =
      moduleUsers.get<TypeormUtilsService<Users>>(TypeormUtilsService);
    repositoryUser = moduleUsers.get<Repository<Users>>(
      CURRENT_ENTITY_REPOSITORY
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('TypeormUtilsService.currentAlias', () => {
    expect(typeormUtilsServiceUserGroups.currentAlias).toBe('UserGroups');
  });

  it('TypeormUtilsService.getAliasForRelation', () => {
    expect(typeormUtilsServiceUserGroups.getAliasForRelation('users')).toBe(
      'UserGroups__Users_users'
    );
  });

  it('TypeormUtilsService.getAliasPath', () => {
    expect(typeormUtilsServiceUserGroups.getAliasPath('id')).toBe(
      'UserGroups.id'
    );
    expect(
      typeormUtilsServiceUserGroups.getAliasPath('Users', 'UserGroups')
    ).toBe('UserGroups.Users');
    expect(
      typeormUtilsServiceUserGroups.getAliasPath('Users', 'UserGroups', '-')
    ).toBe('UserGroups-Users');
    expect(
      typeormUtilsServiceUserGroups.getAliasPath('label', 'users', '-')
    ).toBe('Users-label');
  });

  describe('asyncIterateFindRelationships', () => {
    it('should be ok', async () => {
      const notes = await notesRepository.find();
      const userGroup = await userGroupRepository.find();

      const data = {
        notes: {
          data: [
            {
              type: 'notes',
              id: notes[0].id,
            },
          ],
        },
        manager: {
          data: {
            type: 'users',
            id: '1',
          },
        },
        userGroup: {
          data: {
            type: 'users-group',
            id: `${userGroup[0].id}`,
          },
        },
      } as any;

      const result = [];
      for await (const item of typeormUtilsServiceUser.asyncIterateFindRelationships(
        data
      )) {
        result.push(item);
      }

      expect(result[0]).toHaveProperty('notes');
      expect(result[0]['notes']).toEqual([{ id: notes[0].id }]);

      expect(result[1]).toHaveProperty('manager');
      expect(result[1]['manager']).toEqual({ id: 1 });

      expect(result[2]).toHaveProperty('userGroup');
      expect(result[2]['userGroup']).toEqual({ id: userGroup[0].id });
    });

    it('should be error props incorrect', async () => {
      const data = {
        incorrectProps: {
          type: 'users',
          id: '1',
        },
      } as any;
      expect.assertions(1);
      try {
        await typeormUtilsServiceUser
          .asyncIterateFindRelationships(data)
          .next();
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('should be error resource not found', async () => {
      const data = {
        manager: {
          data: {
            id: '1000',
            type: 'users',
          },
        },
      } as any;
      expect.assertions(1);
      try {
        await typeormUtilsServiceUser
          .asyncIterateFindRelationships(data)
          .next();
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  describe('getFilterExpressionForTarget', () => {
    it('expression for target field with null', () => {
      const nullableField = 'id';
      const notNullableField = 'login';
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        [nullableField]: {
          [FilterOperand.eq]: null,
        },
        [notNullableField]: {
          [FilterOperand.ne]: null,
        },
      };

      function guardField<R extends any>(
        filter: any,
        field: any
      ): asserts field is keyof R {
        if (filter && !(field in filter))
          throw new Error('field not exist in query filter');
      }

      const result =
        typeormUtilsServiceUser.getFilterExpressionForTarget(query);
      const mainAliasCheck = 'Users';

      for (const item of result) {
        const { params, alias, expression, selectInclude } = item;
        expect(selectInclude).toBe(undefined);
        if (!alias) {
          expect(alias).not.toBe(undefined);
          throw new Error('alias in undefined for result');
        }
        const [mainAlias, field] = alias.split('.');
        expect(mainAlias).toBe(mainAliasCheck);
        guardField(query.filter.target, field);
        const filterName: any = query.filter.target[field];
        if (!filterName) {
          expect(filterName).not.toBe(undefined);
          throw new Error('filterName in undefined from query');
        }

        expect(params).toBe(undefined);

        if (field === nullableField) {
          expect(expression).toBe('IS NULL');
          continue;
        }

        if (field === notNullableField) {
          expect(expression).toBe('IS NOT NULL');
          continue;
        }

        throw new Error('filed is incorrect');
      }
    });
    it('expression for target field', () => {
      const valueTest = (filterOperand: FilterOperand) =>
        `test for ${filterOperand}`;
      const valueTestArray = (
        filterOperand: FilterOperand.nin | FilterOperand.in
      ): [string, ...string[]] => [valueTest(filterOperand)];

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        id: {
          [FilterOperand.eq]: valueTest(FilterOperand.eq),
          [FilterOperand.ne]: valueTest(FilterOperand.ne),
        },
        isActive: {
          [FilterOperand.like]: valueTest(FilterOperand.like),
          [FilterOperand.regexp]: valueTest(FilterOperand.regexp),
        },
        firstName: {
          [FilterOperand.gt]: valueTest(FilterOperand.gt),
          [FilterOperand.gte]: valueTest(FilterOperand.gte),
        },
        testDate: {
          [FilterOperand.lt]: valueTest(FilterOperand.lt),
          [FilterOperand.lte]: valueTest(FilterOperand.lt),
        },
        createdAt: {
          [FilterOperand.in]: valueTestArray(FilterOperand.in),
          [FilterOperand.nin]: valueTestArray(FilterOperand.nin),
        },
      };

      function guardField<R extends any>(
        filter: any,
        field: any
      ): asserts field is keyof R {
        if (filter && !(field in filter))
          throw new Error('field not exist in query filter');
      }

      const result =
        typeormUtilsServiceUser.getFilterExpressionForTarget(query);
      const mainAliasCheck = 'Users';
      const paramsNameSet = new Set<string>();
      for (const item of result) {
        const { params, alias, expression, selectInclude } = item;
        expect(selectInclude).toBe(undefined);
        if (!alias) {
          expect(alias).not.toBe(undefined);
          throw new Error('alias in undefined for result');
        }
        const [mainAlias, field] = alias.split('.');
        expect(mainAlias).toBe(mainAliasCheck);
        guardField(query.filter.target, field);
        const filterName: any = query.filter.target[field];
        if (!filterName) {
          expect(filterName).not.toBe(undefined);
          throw new Error('filterName in undefined from query');
        }
        if (!params) {
          expect(params).not.toBe(undefined);
          throw new Error('params in undefined for result');
        }
        if (Array.isArray(params)) {
          expect(params).not.toBeInstanceOf(Array);
          throw new Error('params in undefined for result');
        }
        const { val, name } = params;
        expect(paramsNameSet.has(name)).toBe(false);
        paramsNameSet.add(name);
        const reg = new RegExp(`params_${alias}_\\d{1,}`);
        const regResult = name.match(reg);

        if (regResult === null) {
          expect(name.match(reg)).not.toBe(null);
          throw new Error(`name is not pattern: params_${alias}_\\d{1,}`);
        }
        const expressionMap = expression.replace(name, EXPRESSION);

        const checkFilterOperand = Object.entries({
          ...FilterOperand,
          like: 'ilike',
        } as any).find(
          // @ts-ignore
          ([key, val]) => OperandsMapExpression[val] === expressionMap
        );

        if (!checkFilterOperand) {
          expect(checkFilterOperand).not.toBe(undefined);
          throw new Error(`expression incorrect`);
        }

        const operand = checkFilterOperand[0] as any;
        guardField(filterName, operand);
        if (operand === 'like') {
          expect(params.val).toEqual(`%${filterName[operand]}%`);
        } else {
          expect(params.val).toEqual(filterName[operand]);
        }
      }
    });
    it('expression for target relation field with relation column', () => {
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        addresses: {
          [FilterOperand.eq]: 'null',
          [FilterOperand.ne]: 'null',
        },
      };
      const result =
        typeormUtilsServiceUser.getFilterExpressionForTarget(query);
      expect(result.length).toBe(2);
      const [first, second] = result;
      expect(first).not.toHaveProperty('params');
      expect(first).not.toHaveProperty('selectInclude');
      expect(first['alias']).toBe('Users.addresses');
      expect(first['expression']).toBe('IS NULL');
      expect(second).not.toHaveProperty('params');
      expect(second).not.toHaveProperty('selectInclude');
      expect(second['alias']).toBe('Users.addresses');
      expect(second['expression']).toBe('IS NOT NULL');
    });
    it('expression for target relation field with one-to-many', () => {
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        comments: {
          [FilterOperand.eq]: 'null',
          [FilterOperand.ne]: 'null',
        },
      };
      const subQuery = repositoryUser
        .createQueryBuilder()
        .subQuery()
        .select('Comments.createdBy', 'createdBy')
        .from(Comments, 'Comments')
        .where(`Comments.createdBy = Users.id`)
        .getQuery();
      const result =
        typeormUtilsServiceUser.getFilterExpressionForTarget(query);
      expect(result.length).toBe(2);
      const [first, second] = result;
      expect(first).not.toHaveProperty('params');
      expect(first).not.toHaveProperty('selectInclude');
      expect(first).not.toHaveProperty('alias');
      expect(first['expression']).toBe(`NOT EXISTS ${subQuery}`);
      expect(second).not.toHaveProperty('params');
      expect(second).not.toHaveProperty('selectInclude');
      expect(second).not.toHaveProperty('alias');
      expect(second['expression']).toBe(`EXISTS ${subQuery}`);
    });
    it('expression for target relation field with many-to-many', () => {
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        roles: {
          [FilterOperand.eq]: 'null',
          [FilterOperand.ne]: 'null',
        },
      };
      const subQuery = getQuery()
        .where(`Users-Roles.user_id = Users.id`)
        .getQuery();
      const result =
        typeormUtilsServiceUser.getFilterExpressionForTarget(query);

      expect(result.length).toBe(2);
      const [first, second] = result;
      expect(first).not.toHaveProperty('params');
      expect(first).not.toHaveProperty('selectInclude');
      expect(first).not.toHaveProperty('alias');
      expect(first['expression']).toBe(`NOT EXISTS ${subQuery}`);
      expect(second).not.toHaveProperty('params');
      expect(second).not.toHaveProperty('selectInclude');
      expect(second).not.toHaveProperty('alias');
      expect(second['expression']).toBe(`EXISTS ${subQuery}`);
    });
  });

  describe('getFilterExpressionForRelation', () => {
    it('expression for relation many-to-many', () => {
      const query = getDefaultQuery<Users>();
      const conditional = {
        name: {
          [FilterOperand.eq]: 'null',
          [FilterOperand.ne]: 'null',
        },
        createdAt: {
          [FilterOperand.eq]: 'test1',
          [FilterOperand.ne]: 'test2',
          [FilterOperand.nin]: ['test3'] as [string, ...string[]],
        },
      };

      query.filter.relation = {
        roles: conditional,
      };

      let subQuery = getQuery()
        .where(`"Users__Roles_roles"."name" IS NULL`)
        .andWhere(`"Users__Roles_roles"."name" IS NOT NULL`)
        .andWhere(`"Users__Roles_roles"."created_at" = :param1`)
        .andWhere(`"Users__Roles_roles"."created_at" <> :param2`)
        .andWhere(`"Users__Roles_roles"."created_at" NOT IN (:...param3)`)
        .getQuery();

      const result =
        typeormUtilsServiceUser.getFilterExpressionForRelation(query);

      expect(result.length).toBe(1);

      const [first] = result;
      expect(first).not.toHaveProperty('selectInclude');
      if (!first.params && !Array.isArray(first.params)) {
        expect(first).toHaveProperty('params');
        expect(first.params).toBeInstanceOf(Array);
      }
      if (Array.isArray(first.params)) {
        expect(first?.params?.length).toBe(3);
        const [firstParams, secondParams, thirdParams] = first.params;
        expect(firstParams?.val).toBe(conditional.createdAt.eq);

        const regResult1 = firstParams?.name.match(
          new RegExp(`params_Roles.createdAt_\\d{1,}`)
        );
        if (regResult1) {
          subQuery = subQuery.replace('param1', regResult1[0]);
        }
        expect(regResult1).not.toBe(null);

        expect(secondParams?.val).toBe(conditional.createdAt.ne);

        const regResult2 = secondParams?.name.match(
          new RegExp(`params_Roles.createdAt_\\d{1,}`)
        );
        if (regResult2) {
          subQuery = subQuery.replace('param2', regResult2[0]);
        }
        expect(regResult2).not.toBe(null);

        expect(thirdParams?.val).toBe(conditional.createdAt.nin);
        const regResult3 = thirdParams?.name.match(
          new RegExp(`params_Roles.createdAt_\\d{1,}`)
        );
        if (regResult3) {
          subQuery = subQuery.replace('param3', regResult3[0]);
        }
      }
      expect(first.alias).toBe(`Users.id`);
      expect(first.expression).toBe(`IN ${subQuery}`);
    });

    it('expression for relation other type', () => {
      const query = getDefaultQuery<Users>();
      query.filter.relation = {
        addresses: {
          createdAt: {
            eq: 'qweqwe',
          },
        },
        comments: {
          createdAt: {
            like: 'sdfsdf',
          },
        },
      };
      const firstAlias = 'Addresses.createdAt';
      const secondAlias = 'Comments.createdAt';
      const result =
        typeormUtilsServiceUser.getFilterExpressionForRelation(query);

      expect(result.length).toBe(2);
      const [first, second] = result;

      const firstResult = first.expression.match(
        new RegExp(`params_${firstAlias}_\\d{1,}`)
      );

      if (!firstResult) {
        expect(firstResult).not.toBe(null);
        throw Error('Should be like pattern');
      }

      expect(first.expression).toBe(`= :${firstResult[0]}`);
      expect(first.alias).toBe(`Users__Addresses_addresses.createdAt`);
      expect(first.selectInclude).toBe('addresses');
      if (!Array.isArray(first.params)) {
        expect(first.params?.name).toBe(`${firstResult[0]}`);
        expect(first.params?.val).toBe(
          query.filter.relation?.addresses?.createdAt?.eq
        );
      } else {
        expect(first.params).not.toBeInstanceOf(Array);
      }

      const secondResult = second.expression.match(
        new RegExp(`params_${secondAlias}_\\d{1,}`)
      );
      if (!secondResult) {
        expect(secondResult).not.toBe(null);
        throw Error('Should be like pattern');
      }

      expect(second.expression).toBe(`LIKE :${secondResult[0]}`);
      expect(second.alias).toBe('Users__Comments_comments.createdAt');
      expect(second.selectInclude).toBe('comments');
      if (!Array.isArray(second.params)) {
        expect(second.params?.name).toBe(secondResult[0]);
        expect(second.params?.val).toBe(
          `%${query.filter.relation?.comments?.createdAt?.like}%`
        );
      } else {
        expect(second.params).not.toBeInstanceOf(Array);
      }
    });
  });

  describe('validateRelationInputData', () => {
    let usersData: Users;
    beforeEach(async () => {
      const result = await userRepository.findOne({
        where: {
          id: 1,
        },
        relations: {
          roles: true,
          userGroup: true,
          manager: true,
        },
      });
      if (!result) {
        throw Error('not found mock data');
      }
      usersData = result;
    });
    it('should be ok', async () => {
      const rolesData = usersData.roles.map((i) => ({
        type: 'roles',
        id: i.id.toString(),
      }));

      const userGroupData = {
        type: 'user-groups',
        id: usersData.userGroup?.id.toString(),
      };
      const managerData = {
        type: 'users',
        id: usersData.manager?.id.toString(),
      };
      const emptyRoles: { id: string; type: string }[] = [];
      const emptyManager = null;
      const result = await typeormUtilsServiceUser.validateRelationInputData(
        'roles',
        rolesData
      );
      const result1 = await typeormUtilsServiceUser.validateRelationInputData(
        'userGroup',
        userGroupData as any
      );
      const result2 = await typeormUtilsServiceUser.validateRelationInputData(
        'manager',
        managerData
      );
      const result3 = await typeormUtilsServiceUser.validateRelationInputData(
        'manager',
        emptyManager
      );
      const result4 = await typeormUtilsServiceUser.validateRelationInputData(
        'roles',
        emptyRoles
      );
      expect(result).toEqual(usersData.roles.map((i) => i.id.toString()));
      expect(result1).toEqual(usersData.userGroup?.id.toString());
      expect(result2).toEqual(usersData.manager.id.toString());
      expect(result3).toEqual(emptyManager);
      expect(result4).toEqual(emptyRoles);
    });

    it('Should be error incorrect type name', async () => {
      const rolesData = usersData.roles.map((i, index) => ({
        type: index === 1 ? 'other' : 'roles',
        id: i.id.toString(),
      })) as PostRelationshipData;

      const userGroupData = {
        type: 'userGroups',
        id: usersData.userGroup?.id.toString(),
      };
      const managerData = {
        type: 'user',
        id: usersData.manager.id.toString(),
      };
      expect.assertions(3);
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'roles',
          rolesData
        );
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
      }
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'userGroup',
          userGroupData as any
        );
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
      }
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'manager',
          managerData
        );
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
      }
    });

    it('Should be error, Incorrect relation type', async () => {
      expect.assertions(2);
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'roles',
          {} as any
        );
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
      }
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'userGroup',
          [] as any
        );
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
      }
    });

    it('Should be error, Not fond', async () => {
      const rolesData = usersData.roles.map((i, index) => ({
        type: 'roles',
        id: index === 1 ? '1000' : i.id.toString(),
      })) as PostRelationshipData;
      expect.assertions(2);
      try {
        await typeormUtilsServiceUser.validateRelationInputData(
          'roles',
          rolesData
        );
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
      try {
        await typeormUtilsServiceUser.validateRelationInputData('userGroup', {
          type: 'user-groups',
          id: '10000',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
