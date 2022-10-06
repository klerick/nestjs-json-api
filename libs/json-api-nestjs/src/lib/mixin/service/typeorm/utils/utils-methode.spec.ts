import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';

import {mockDBTestModule, Users, Roles, Addresses} from '../../../../mock-utils';
import {DEFAULT_CONNECTION_NAME} from '../../../../constants';
import {UtilsMethode} from './utils-methode';
import {snakeToCamel} from '../../../../helper';
import {Filter, FilterOperand} from '../../../../types';
import {OperandsMap, OperandMapForNull} from '../../../../types-common';
import {ResourceRequestObject} from '../../../../types-common/request';
import {NotFoundException, UnprocessableEntityException} from '@nestjs/common';

describe('Utils methode test', () => {
  let repository: Repository<Users>;
  beforeAll(async () => {

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [

        {
          provide: getRepositoryToken(Users, DEFAULT_CONNECTION_NAME),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users)
          },
          inject: [
            getDataSourceToken()
          ]
        },
      ]
    }).compile();

    repository = module.get<Repository<Users>>(getRepositoryToken(Users, DEFAULT_CONNECTION_NAME));

    const address = await repository.manager.getRepository(Addresses).save(Object.assign(new Addresses(), {
      country: 'country',
      state: 'state'
    }))

    await repository.manager.getRepository(Roles).save(Object.assign(new Roles(), {
      name: 'user',
      key: 'USER',
      isDefault: true
    }))

    await repository.save(Object.assign(new Users(), {
      firstName: 'firstName',
      testDate: new Date(),
      lastName: 'lastName',
      isActive: true,
      login: 'login',
      addresses: address
    }))
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('UtilsMethode.applyQueryFiltersTarget', () => {
    it('expression for target field', () => {
      const alias = snakeToCamel(repository.metadata.name);
      const queryBuilder = repository.createQueryBuilder(alias)
      const filter = {
        login: {[FilterOperand.eq]: 'test'},
        firstName: {[FilterOperand.gt]: 'test'},
        isActive: {[FilterOperand.gte]: 'test'},
        lastName: {[FilterOperand.in]: ['test', 'test']},
        createdAt: {[FilterOperand.like]: 'test'},
        updatedAt: {[FilterOperand.lt]: 'test'},
        id: {[FilterOperand.lte]: 'test'},
      };
      const filter2 = {
        login: {[FilterOperand.ne]: 'test'},
        firstName: {[FilterOperand.nin]: ['test']},
        isActive: {[FilterOperand.regexp]: 'test'},
        lastName: {[FilterOperand.some]: ['test', 'test']},
      };
      const filter3 = {
        login: {[FilterOperand.eq]: 'null'},
        firstName: {[FilterOperand.ne]: 'null'},
      };
      const expression = UtilsMethode.applyQueryFiltersTarget<Users>(
        queryBuilder,
        filter,
        repository.metadata
      );

      const expression2 = UtilsMethode.applyQueryFiltersTarget<Users>(
        queryBuilder,
        filter2,
        repository.metadata
      );

      const expression3 = UtilsMethode.applyQueryFiltersTarget<Users>(
        queryBuilder,
        filter3,
        repository.metadata
      );

      const params = Object.keys(filter);
      for (let i = 0; i < params.length; i++) {
        const paramsName = UtilsMethode.getParamName(`${alias}.${params[i]}`, i);
        const operand = Object.keys(filter[params[i]])[0];
        const checkExpression = OperandsMap[operand].replace('EXPRESSION', paramsName)
        expect(expression[i].expression).toBe(`${alias}.${params[i]} ${checkExpression}`);
        expect(expression[i].params.name).toBe(paramsName);
        if (operand === FilterOperand.like) {
          expect(expression[i].params.val).toBe(`%${filter[params[i]][operand]}%`);
        } else {
          expect(expression[i].params.val).toBe(filter[params[i]][operand]);
        }
        expect(expression[i]).not.toHaveProperty('selectInclude')
      }

      const params2 = Object.keys(filter2);
      for (let i = 0; i < params2.length; i++) {
        const paramsName = UtilsMethode.getParamName(`${alias}.${params2[i]}`, i);
        const operand = Object.keys(filter2[params2[i]])[0];
        const checkExpression = OperandsMap[operand].replace('EXPRESSION', paramsName)
        expect(expression2[i].expression).toBe(`${alias}.${params2[i]} ${checkExpression}`);
        if (operand === FilterOperand.like) {
          expect(expression2[i].params.val).toBe(`%${filter2[params[i]][operand]}%`);
        } else {
          expect(expression2[i].params.val).toBe(filter2[params[i]][operand]);
        }
        expect(expression2[i]).not.toHaveProperty('selectInclude')
      }

      const params3 = Object.keys(filter3);
      for (let i = 0; i < params3.length; i++) {
        const paramsName = UtilsMethode.getParamName(`${alias}.${params3[i]}`, i);
        const operand = Object.keys(filter3[params3[i]])[0];
        const checkExpression = OperandsMap[operand].replace('EXPRESSION', paramsName)
        expect(expression3[i].expression).toBe(`${alias}.${params3[i]} ${checkExpression}`);
        expect(expression3[i].params.val).toBe(filter3[params[i]][operand]);
        expect(expression3[i]).not.toHaveProperty('selectInclude')
      }

    })

    it('expression for null target field', () => {
      const alias = snakeToCamel(repository.metadata.name)
      const queryBuilder = repository.createQueryBuilder(alias)
      const filter = {
        addresses: {
          [FilterOperand.eq]: 'null'
        },
        comments: {
          [FilterOperand.eq]: 'null'
        },
        roles: {
          [FilterOperand.eq]: 'null'
        }
      };
      const expression = UtilsMethode.applyQueryFiltersTarget<Users>(
        queryBuilder,
        filter,
        repository.metadata
      );

      const commentQuery =  repository.manager
        .getRepository('comments')
        .createQueryBuilder('comments')
        .select('comments.createdBy')
        .where(`comments.createdBy = ${alias}.id`).getQuery();
      const rolesQuery = repository.manager
        .getRepository('users_have_roles')
        .createQueryBuilder('users_have_roles')
        .select('users_have_roles.user_id', 'users_have_roles_user_id')
        .leftJoin('roles', 'roles', 'users_have_roles.role_id = roles.id')
        .where(`users_have_roles.user_id = ${alias}.id`)
        .getQuery();
      expect(expression[0].expression).toBe('users.addresses IS NULL');
      expect(expression[1].expression).toBe(`NOT EXISTS (${commentQuery})`);
      expect(expression[2].expression).toBe(`NOT EXISTS (${rolesQuery})`);
      expect(expression[0].params).toBe(null);
      expect(expression[1].params).toBe(null);
      expect(expression[2].params).toBe(null);
      expect(expression[0]).not.toHaveProperty('selectInclude')
      expect(expression[1]).not.toHaveProperty('selectInclude')
      expect(expression[2]).not.toHaveProperty('selectInclude')

      const repository1 = repository.manager.getRepository<Roles>('roles')
      const alias1 = snakeToCamel(repository1.metadata.name)
      const queryBuilder1 = repository1.createQueryBuilder(alias1)

      const usersQuery = repository.manager
        .getRepository('users_have_roles')
        .createQueryBuilder('users_have_roles')
        .select('users_have_roles.role_id', 'users_have_roles_role_id')
        .leftJoin('users', 'users', 'users_have_roles.user_id = users.id')
        .where(`users_have_roles.role_id = ${alias1}.id`)
        .getQuery();
      const expression1 = UtilsMethode.applyQueryFiltersTarget<Roles>(
        queryBuilder1,
        {
          users: {
            ne: null
          }
        },
        repository1.metadata
      );
      expect(expression1[0].expression).toBe(`EXISTS (${usersQuery})`);
      expect(expression1[0].params).toBe(null);
      expect(expression1[0]).not.toHaveProperty('selectInclude')
    })
  });

  describe('UtilsMethode.applyQueryFilterRelation', () => {
    it('expression for relation many-to-one', async () => {
      const alias = snakeToCamel(repository.metadata.name);
      const queryBuilder = repository.createQueryBuilder(alias)
      const filter = {
        manager: {
          login: {[FilterOperand.eq]: 'test'},
          firstName: {[FilterOperand.gt]: 'test'},
          isActive: {[FilterOperand.gte]: 'test'},
          lastName: {[FilterOperand.in]: ['test', 'test']},
          createdAt: {[FilterOperand.like]: 'test'},
          updatedAt: {[FilterOperand.lt]: 'test'},
          id: {[FilterOperand.lte]: 'test'},
        },
      };

      const filter2 = {
        manager: {
          login: {[FilterOperand.ne]: 'test'},
          firstName: {[FilterOperand.nin]: ['test']},
          isActive: {[FilterOperand.regexp]: 'test'},
          lastName: {[FilterOperand.some]: ['test', 'test']},
        },
      };
      const filter3 = {
        manager: {
          login: {[FilterOperand.eq]: 'null'},
          firstName: {[FilterOperand.ne]: 'null'},
        },
      };
      const expression = UtilsMethode.applyQueryFilterRelation<Users>(
        queryBuilder,
        filter,
        repository.metadata
      );

      const expression2 = UtilsMethode.applyQueryFilterRelation<Users>(
        queryBuilder,
        filter2,
        repository.metadata
      );


      const expression3 = UtilsMethode.applyQueryFilterRelation<Users>(
        queryBuilder,
        filter3,
        repository.metadata
      );

      const params = Object.keys(filter.manager);
      for (let i = 0; i < params.length; i++) {
        const alias = 'manager';
        const paramsName = UtilsMethode.getParamName(`${alias}.${params[i]}`, i);
        const operand = Object.keys(filter.manager[params[i]])[0];
        const checkExpression = OperandsMap[operand].replace('EXPRESSION', paramsName)
        expect(expression[i].expression).toBe(`${alias}.${params[i]} ${checkExpression}`);
        expect(expression[i].params.name).toBe(paramsName);
        if (operand === FilterOperand.like) {
          expect(expression[i].params.val).toBe(`%${filter.manager[params[i]][operand]}%`);
        } else {
          expect(expression[i].params.val).toBe(filter.manager[params[i]][operand]);
        }
        expect(expression[i].selectInclude).toBe('manager')
      }

      const params2 = Object.keys(filter2.manager);
      for (let i = 0; i < params2.length; i++) {
        const alias = 'manager';
        const paramsName = UtilsMethode.getParamName(`${alias}.${params2[i]}`, i);
        const operand = Object.keys(filter2.manager[params2[i]])[0];
        const checkExpression = OperandsMap[operand].replace('EXPRESSION', paramsName)
        expect(expression2[i].expression).toBe(`${alias}.${params2[i]} ${checkExpression}`);
        if (operand === FilterOperand.like) {
          expect(expression2[i].params.val).toBe(`%${filter2.manager[params[i]][operand]}%`);
        } else {
          expect(expression2[i].params.val).toBe(filter2.manager[params[i]][operand]);
        }
        expect(expression2[i].selectInclude).toBe('manager')
      }

      const params3 = Object.keys(filter3.manager);
      for (let i = 0; i < params3.length; i++) {
        const alias = 'manager';
        const paramsName = UtilsMethode.getParamName(`${alias}.${params3[i]}`, i);
        const operand = Object.keys(filter3.manager[params3[i]])[0];
        const checkExpression = OperandMapForNull[operand].replace('EXPRESSION', paramsName)
        expect(expression3[i].expression).toBe(`${alias}.${params3[i]} ${checkExpression}`);
        expect(expression3[i].params).toBe(null);
        expect(expression2[i].selectInclude).toBe('manager')
      }
    })

    it('expression for relation many-to-many', async () => {
        const alias = snakeToCamel(repository.metadata.name);
        const queryBuilder = repository.createQueryBuilder(alias);
        const filter: Filter<Users>['relation'] = {
          roles: {
            name: {
              [FilterOperand.eq]: 'test'
            }
          }
        }

      const query = repository.manager
        .getRepository('users_have_roles')
        .createQueryBuilder('users_have_roles')
        .select('users_have_roles.user_id', 'users_have_roles_user_id')
        .leftJoin('roles', 'roles', 'users_have_roles.role_id = roles.id')

        const expression = UtilsMethode.applyQueryFilterRelation<Users>(
          queryBuilder,
          filter,
          repository.metadata
        );
        const params = Object.keys(filter);
        for (let i = 0; i < params.length; i++) {
          const relName = params[i]
          const fieldName = Object.keys(filter[params[i]])[0];
          const operand = Object.keys(filter[params[i]][fieldName])[0];
          const paramsName = UtilsMethode.getParamName(`${relName}.${fieldName}`, i)
          const resultQuery = query.where(`${relName}.${fieldName} ${OperandsMap[operand].replace('EXPRESSION', paramsName)}`).getQuery();
          const check = `${alias}.id IN (${resultQuery})`
          expect(expression[i].expression).toBe(check);
          expect(expression[i].params.val).toBe(filter[relName][fieldName][operand]);
          expect(expression[i].params.name).toBe(paramsName);
        }


    })

    it('expression for relation one-to-many', async () => {
      const alias = snakeToCamel(repository.metadata.name);
      const queryBuilder = repository.createQueryBuilder(alias);
      const filter: Filter<Users>['relation'] = {
        comments: {
          kind: {
            [FilterOperand.eq]: 'test'
          }
        }
      }

      const query = repository.manager
        .getRepository('comments')
        .createQueryBuilder('comments')
        .select('comments.createdBy')

      const expression = UtilsMethode.applyQueryFilterRelation<Users>(
        queryBuilder,
        filter,
        repository.metadata
      );

      const expression1 = UtilsMethode.applyQueryFilterRelation<Users>(
        queryBuilder,
        {
          manager: {
            login: {
              eq: 'text'
            }
          }
        },
        repository.metadata
      );

      const params = Object.keys(filter);
      for (let i = 0; i < params.length; i++) {
        const relName = params[i]
        const fieldName = Object.keys(filter[params[i]])[0];
        const operand = Object.keys(filter[params[i]][fieldName])[0];
        const paramsName = UtilsMethode.getParamName(`${relName}.${fieldName}`, i)
        const resultQuery = query.where(`${relName}.${fieldName} ${OperandsMap[operand].replace('EXPRESSION', paramsName)}`).getQuery();
        const check = `${alias}.id IN (${resultQuery})`
        expect(expression[i].expression).toBe(check);
        expect(expression[i].params.val).toBe(filter[relName][fieldName][operand]);
        expect(expression[i].params.name).toBe(paramsName);
      }
    })
  })

  describe('UtilsMethode.asyncIterateFindRelationships', () => {
    it('should be error: Resource does not exist', async () => {
      expect.assertions(1);
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        rolestest: {
          data: [{type: 'roles', id: '1'}]
        }
      } as any;
      try {
        for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {

        }
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException)
      }

    })

    it('should be error: ids does not exist', async () => {
      expect.assertions(2);
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        roles: {
          data: [{
            type: 'roles', id: '2'
          },{
            type: 'roles', id: '3'
          }],
        }
      };
      try {
        for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {

        }
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException)
        expect(e.response.detail).toBe(`Resource 'roles' with ids '${data.roles.data.map(i => i.id).join(',')}' does not exist`)
      }

    })

    it('should be error: id does not exist', async () => {
      expect.assertions(2);
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        addresses: {
          data: {
            type: 'addresses', id: '3'
          },
        }
      };
      try {
        for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {

        }
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException)
        expect(e.response.detail).toBe(`Resource 'addresses' with id '${data.addresses.data.id}' does not exist`)
      }

    })

    it('should be ok', async () => {
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        addresses: {
          data: {
            type: 'addresses', id: '1'
          },
        }
      };
      const result = [];
      for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {
          result.push(tmp);
      }
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(data.addresses.data.id);
      expect(Array.isArray(result[0].rel)).toBe(false)
      expect(result[0].rel).toBeInstanceOf(Addresses)
      expect(result[0].type).toBe(data.addresses.data.type)
      expect(result[0].propsName).toBe(Object.keys(data)[0])
    })

    it('should be ok array', async () => {
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        roles: {
          data: [{
            type: 'roles', id: '1'
          }],
        }
      };
      const result = [];
      for await (const tmp of UtilsMethode.asyncIterateFindRelationships({...data}, repository)) {
        result.push(tmp);
      }

      expect(result.length).toBe(1);
      expect(result[0].id).toEqual(['1']);
      expect(Array.isArray(result[0].rel)).toBe(true)
      expect(result[0].rel[0]).toBeInstanceOf(Roles)
      expect(result[0].type).toBe(data.roles.data[0].type)
      expect(result[0].propsName).toBe(Object.keys(data)[0])
    })

    it('should be ok array type not equal props name', async () => {
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        manager: {
          data: {
            type: 'users', id: '1'
          },
        }
      };
      const result = [];
      for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {
        result.push(tmp);
      }
      expect(result.length).toBe(1);
      expect(Array.isArray(result[0].rel)).toBe(false)
      expect(result[0].rel).toBeInstanceOf(Users)
      expect(result[0].type).toBe(data.manager.data.type)
      expect(result[0].propsName).toBe(Object.keys(data)[0])
    })

    it('should be ok array type not equal props name and null', async () => {
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        manager: {
          data: {
            type: 'users', id: '1'
          },
        },
        comments: {
          data: null
        }
      };
      const result = [];
      for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {
        result.push(tmp);
      }
      expect(result.length).toBe(2);
      expect(Array.isArray(result[0].rel)).toBe(false)
      expect(result[0].rel).toBeInstanceOf(Users)
      expect(result[0].type).toBe(data.manager.data.type)
      expect(result[0].propsName).toBe(Object.keys(data)[0])

      expect(result[1].rel).toEqual(null)
      expect(result[1].type).toBe(null)
      expect(result[1].propsName).toBe(Object.keys(data)[1])
    })

    it('should be ok array type with empty array', async () => {
      const data: ResourceRequestObject<Users>['data']['relationships'] = {
        comments: {
          data: []
        }
      };
      const result = [];
      for await (const tmp of UtilsMethode.asyncIterateFindRelationships(data, repository)) {
        result.push(tmp);
      }

      expect(result.length).toBe(1);
      expect(Array.isArray(result[0].rel)).toBe(true)
      expect(result[0].rel).toEqual([])
      expect(result[0].type).toBe(null)
      expect(result[0].propsName).toBe(Object.keys(data)[0])
    })
  })

  describe('UtilsMethode.validateRelationRequestData', () => {

    it('Should be error, should be array', async () => {
      const dataBody = {type: 'roles', id: '2'} as any;
      expect.assertions(3);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'roles', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
        expect(e.response.message[0].detail).toBe('Body data should be array')
        expect(e.response.message[0].source.parameter).toBe('/data')
      }
    })

    it('Should be error, should be array', async () => {
      const dataBody = [{type: 'addresses', id: '2'}] as any;
      expect.assertions(3);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'addresses', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
        expect(e.response.message[0].detail).toBe('Body data should be object')
        expect(e.response.message[0].source.parameter).toBe('/data')
      }
    })

    it('Should be error, incorrect type in array', async () => {
      const dataBody = [{type: 'roles', id: '2'},{ type: 'rolesFake', id: '3'}] as any;
      expect.assertions(3);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'roles', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
        expect(e.response.message[0].detail).toBe('Type should be equal type of relName: "roles". Type of "roles" is roles')
        expect(e.response.message[0].source.parameter).toBe('/data/1')
      }

    });

    it('Should be error, incorrect type in object', async () => {
      const dataBody = { type: 'rolesFake', id: '3'} as any;
      expect.assertions(3);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'addresses', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(UnprocessableEntityException);
        expect(e.response.message[0].detail).toBe('Type should be equal type of relName: "addresses". Type of "addresses" is addresses')
        expect(e.response.message[0].source.parameter).toBe('/data')
      }
    });

    it('Should be error, rel is not exist', async () => {
      const dataBody = [{ type: 'roles', id: '3'}] as any;
      expect.assertions(2);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'roles', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.response.message[0].detail).toBe('Not exist item "3" in relation "roles"')
      }
    });

    it('Should be error, rel is not exist, arrau data', async () => {
      const dataBody = [{ type: 'roles', id: '3'}, {type: 'roles', id: '1'}] as any;
      expect.assertions(2);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 1, 'roles', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.response.message[0].detail).toBe('Not exist item "3" in relation "roles"')
      }
    });

    it('Should be error, main item not exist', async () => {
      const dataBody = [{type: 'roles', id: '1'}] as any;
      expect.assertions(2);
      try {
        await UtilsMethode.validateRelationRequestData(repository, 5, 'roles', dataBody)
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect(e.response.message[0].detail).toBe('Not exist item "5" in resource "users"')
      }
    })

    it('Should be ok', async () => {
      const dataBody = [{type: 'roles', id: '1'}] as any;
      const itemId = 1
      const {item, rel} = await UtilsMethode.validateRelationRequestData(repository, itemId, 'roles', dataBody);
      expect(item.id).toBe(itemId);
      expect(Array.isArray(rel)).toBe(true);
      expect(rel[0].id).toBe(parseInt(dataBody[0].id, 10))
    })

    it('Should be ok, object', async () => {
      const dataBody = {type: 'addresses', id: '1'} as any;
      const itemId = 1
      const {item, rel} = await UtilsMethode.validateRelationRequestData(repository, itemId, 'addresses', dataBody);
      expect(item.id).toBe(itemId);
      expect(Array.isArray(rel)).toBe(false);
      if (!Array.isArray(rel)) {
        expect(rel.id).toBe(parseInt(dataBody.id, 10))
      }

    })

    it('Should be ok, empty object', async () => {
      const dataBody = null as any;
      const itemId = 1
      const {item, rel} = await UtilsMethode.validateRelationRequestData(repository, itemId, 'addresses', dataBody);
      expect(item.id).toBe(itemId);
      expect(rel).toBe(null);
    });

    it('Should be ok, empty array', async () => {
      const dataBody = [] as any;
      const itemId = 1
      const {item, rel} = await UtilsMethode.validateRelationRequestData(repository, itemId, 'roles', dataBody);
      expect(item.id).toBe(itemId);
      expect(rel).toEqual([]);
    });
  })
})
