import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { mockDBTestModule, Users } from '../../../../../mock-utils';
import {
  CONFIG_PARAM_POSTFIX,
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
} from '../../../../../constants';

import {
  ConfigParam,
  FilterOperand,
  QueryField,
  QueryParams,
} from '../../../../../types';
import { snakeToCamel, getProviderName } from '../../../../../helper';
import { transformMixin } from '../../../transform';
import { typeormMixin } from '../../../typeorm';
import { TypeormMixinService } from '../../typeorm.mixin';

describe('GetAll methode test', () => {
  let typeormService: TypeormMixinService<Users>;
  let configParam: ConfigParam;
  let repository: Repository<Users>;
  const defaultField: QueryParams<Users> = {
    needAttribute: false,
    page: {
      number: DEFAULT_QUERY_PAGE,
      size: DEFAULT_PAGE_SIZE,
    },
    [QueryField.fields]: null,
    [QueryField.sort]: null,
    [QueryField.include]: null,
    [QueryField.filter]: {
      target: null,
      relation: null,
    },
  };
  beforeAll(async () => {
    const transformMixinService = transformMixin(
      Users,
      DEFAULT_CONNECTION_NAME
    );
    const typeormMixinService = typeormMixin(
      Users,
      DEFAULT_CONNECTION_NAME,
      transformMixinService
    );
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        transformMixinService,
        typeormMixinService,
        {
          provide: getRepositoryToken(Users, DEFAULT_CONNECTION_NAME),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users);
          },
          inject: [getDataSourceToken()],
        },
        {
          provide: getProviderName(Users, CONFIG_PARAM_POSTFIX),
          useValue: {
            requiredSelectField: false,
            debug: false,
            maxExecutionTime: 1000,
          },
        },
      ],
    }).compile();

    typeormService =
      module.get<TypeormMixinService<Users>>(typeormMixinService);
    configParam = module.get<ConfigParam>(
      getProviderName(Users, CONFIG_PARAM_POSTFIX)
    );
    repository = module.get<Repository<Users>>(
      getRepositoryToken(Users, DEFAULT_CONNECTION_NAME)
    );
  });

  afterEach(() => {
    configParam.requiredSelectField = false;
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be error if requiredSelectField true', async () => {
    expect.assertions(3);
    configParam.requiredSelectField = true;
    try {
      await typeormService.getAll({ query: defaultField });
    } catch (e) {
      const errorCount = e.response.message.length;
      expect(errorCount).toEqual(e.response.message.length);
      expect(errorCount).toBeGreaterThan(0);
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  it('should be call applyQueryFilters', async () => {
    const applyQueryFilterRelationSpy = jest
      .spyOn(
        Reflect.get(typeormService, 'UtilsMethode'),
        'applyQueryFilterRelation'
      )
      .mockReturnValueOnce([]);
    const applyQueryFiltersTargetSpy = jest
      .spyOn(
        Reflect.get(typeormService, 'UtilsMethode'),
        'applyQueryFiltersTarget'
      )
      .mockReturnValueOnce([]);

    const filter: QueryParams<Users>['filter'] = {
      target: {
        login: { [FilterOperand.eq]: 'test' },
      },
      relation: {
        addresses: {
          country: {
            [FilterOperand.eq]: 'test',
          },
        },
      },
    };

    await typeormService.getAll({
      query: {
        ...defaultField,
        ...{ filter },
      },
    });

    expect(applyQueryFilterRelationSpy).toBeCalled();
    expect(applyQueryFiltersTargetSpy).toBeCalled();
  });

  it('should be not call applyQueryFilters', async () => {
    const applyQueryFilterRelationSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFilterRelation'
    );
    const applyQueryFiltersTargetSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFiltersTarget'
    );

    const filter: QueryParams<Users>['filter'] = {
      target: null,
      relation: null,
    };

    await typeormService.getAll({
      query: {
        ...defaultField,
        ...{ filter },
      },
    });

    expect(applyQueryFilterRelationSpy).not.toBeCalled();
    expect(applyQueryFiltersTargetSpy).not.toBeCalled();
  });

  it('check default query', async () => {
    const applyQueryFilterRelationSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFilterRelation'
    );
    const applyQueryFiltersTargetSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFiltersTarget'
    );
    let joinSpy;
    let selectSpy;
    let offsetSpy;
    let limitSpy;
    let orderBySpy;
    const createQueryBuilderSpy = jest
      .spyOn(repository, 'createQueryBuilder')
      .mockImplementationOnce((...alias) => {
        const builder = repository.createQueryBuilder(...alias);
        joinSpy = jest.spyOn(builder, 'leftJoin');
        selectSpy = jest.spyOn(builder, 'select');
        offsetSpy = jest.spyOn(builder, 'offset');
        limitSpy = jest.spyOn(builder, 'limit');
        orderBySpy = jest.spyOn(builder, 'orderBy');
        return builder;
      });

    const result = await typeormService.getAll({
      query: {
        ...defaultField,
      },
    });
    expect(createQueryBuilderSpy).toBeCalled();
    expect(createQueryBuilderSpy).toBeCalledWith(
      snakeToCamel(repository.metadata.name)
    );
    expect(joinSpy).toBeCalledTimes(0);
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith(`users.id`, 'subQueryId');
    expect(offsetSpy).toBeCalledTimes(1);
    expect(offsetSpy).toBeCalledWith(0);
    expect(limitSpy).toBeCalledTimes(1);
    expect(limitSpy).toBeCalledWith(20);
    expect(orderBySpy).toBeCalledTimes(1);
    expect(orderBySpy).toBeCalledWith({ ['users.id']: 'ASC' });
    expect(applyQueryFilterRelationSpy).not.toBeCalled();
    expect(applyQueryFiltersTargetSpy).not.toBeCalled();

    expect(result.meta).toHaveProperty('debug.prepareParams');
    expect(result.meta).toHaveProperty('debug.callQuery');
    expect(result.meta).toHaveProperty('debug.transform');

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('included');

    expect(result.meta.pageNumber).toBe(1);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.pageSize).toBe(20);
  });

  it('check query with param', async () => {
    configParam.debug = false;
    const filter: QueryParams<Users>['filter'] = {
      target: {
        login: {
          [FilterOperand.eq]: '1',
        },
        addresses: {
          [FilterOperand.eq]: null,
        },
      },
      relation: {
        comments: {
          text: {
            eq: '1',
          },
        },
        manager: {
          login: {
            eq: 'test',
          },
        },
      },
    };

    const page: QueryParams<Users>['page'] = {
      number: 10,
      size: 100,
    };
    const include: QueryParams<Users>['include'] = ['addresses', 'roles'];

    const applyQueryFilterRelationSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFilterRelation'
    );
    const applyQueryFiltersTargetSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFiltersTarget'
    );
    let joinSpy;
    let selectSpy;
    let offsetSpy;
    let limitSpy;
    let orderBySpy;

    let resultJoinSpy;
    let resultSelectSpy;
    let i = 0;

    const originalCreateQueryBuilder =
      repository.createQueryBuilder.bind(repository);
    const createQueryBuilderSpy = jest
      .spyOn(repository, 'createQueryBuilder')
      .mockImplementation((...alias) => {
        const builder = originalCreateQueryBuilder(...alias);
        if (i === 0) {
          joinSpy = jest.spyOn(builder, 'leftJoin');
          selectSpy = jest.spyOn(builder, 'select');
          offsetSpy = jest.spyOn(builder, 'offset');
          limitSpy = jest.spyOn(builder, 'limit');
          orderBySpy = jest.spyOn(builder, 'orderBy');
        }
        if (i === 1) {
          resultJoinSpy = jest.spyOn(builder, 'leftJoin');
          resultSelectSpy = jest.spyOn(builder, 'select');
        }
        if (i > 1) {
          createQueryBuilderSpy.mockReset();
        }
        i++;
        return builder;
      });

    const result = await typeormService.getAll({
      query: {
        ...defaultField,
        ...{
          filter,
          include,
          page,
          sort: {
            addresses: { country: 'ASC' },
            target: { login: 'DESC' },
          },
        },
      },
    });

    expect(joinSpy).toBeCalledTimes(2);
    expect(joinSpy).toHaveBeenNthCalledWith(1, 'users.manager', 'manager');
    expect(joinSpy).toHaveBeenNthCalledWith(2, 'users.addresses', 'addresses');
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith(`users.id`, 'subQueryId');
    expect(offsetSpy).toBeCalledTimes(1);
    expect(offsetSpy).toBeCalledWith((page.number - 1) * page.size);
    expect(limitSpy).toBeCalledTimes(1);
    expect(limitSpy).toBeCalledWith(page.size);
    expect(orderBySpy).toBeCalledTimes(1);
    expect(orderBySpy).toBeCalledWith({
      ['addresses.country']: 'ASC',
      ['users.login']: 'DESC',
    });
    expect(applyQueryFilterRelationSpy).toBeCalledTimes(1);
    expect(applyQueryFiltersTargetSpy).toBeCalledTimes(1);

    expect(result.meta).not.toHaveProperty('debug.prepareParams');
    expect(result.meta).not.toHaveProperty('debug.callQuery');
    expect(result.meta).not.toHaveProperty('debug.transform');

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('included');

    expect(result.meta.pageNumber).toBe(page.number);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.pageSize).toBe(page.size);

    expect(resultJoinSpy).toBeCalledTimes(2);
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      1,
      `users.${include[0]}`,
      include[0]
    );
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      2,
      `users.${include[1]}`,
      include[1]
    );

    expect(resultSelectSpy).toBeCalledTimes(1);
    expect(resultSelectSpy).toBeCalledWith([...include, 'users']);
  });

  it('check query with param and select field', async () => {
    configParam.debug = false;
    const filter: QueryParams<Users>['filter'] = {
      target: {
        login: {
          [FilterOperand.eq]: '1',
        },
        addresses: {
          [FilterOperand.eq]: null,
        },
      },
      relation: {
        comments: {
          text: {
            eq: '1',
          },
        },
        manager: {
          login: {
            eq: 'test',
          },
        },
      },
    };

    const page: QueryParams<Users>['page'] = {
      number: 10,
      size: 100,
    };
    const fields: QueryParams<Users>['fields'] = {
      manager: ['login', 'lastName'],
      comments: ['text'],
      target: ['lastName'],
    };
    const include: QueryParams<Users>['include'] = [
      'addresses',
      'roles',
      'manager',
      'comments',
    ];

    const applyQueryFilterRelationSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFilterRelation'
    );
    const applyQueryFiltersTargetSpy = jest.spyOn(
      Reflect.get(typeormService, 'UtilsMethode'),
      'applyQueryFiltersTarget'
    );
    let joinSpy;
    let selectSpy;
    let offsetSpy;
    let limitSpy;
    let orderBySpy;

    let resultJoinSpy;
    let resultSelectSpy;
    let i = 0;

    const originalCreateQueryBuilder =
      repository.createQueryBuilder.bind(repository);
    const createQueryBuilderSpy = jest
      .spyOn(repository, 'createQueryBuilder')
      .mockImplementation((...alias) => {
        const builder = originalCreateQueryBuilder(...alias);
        if (i === 0) {
          joinSpy = jest.spyOn(builder, 'leftJoin');
          selectSpy = jest.spyOn(builder, 'select');
          offsetSpy = jest.spyOn(builder, 'offset');
          limitSpy = jest.spyOn(builder, 'limit');
          orderBySpy = jest.spyOn(builder, 'orderBy');
        }
        if (i === 1) {
          resultJoinSpy = jest.spyOn(builder, 'leftJoin');
          resultSelectSpy = jest.spyOn(builder, 'select');
        }
        if (i > 1) {
          createQueryBuilderSpy.mockReset();
        }
        i++;
        return builder;
      });

    const result = await typeormService.getAll({
      query: {
        ...defaultField,
        ...{
          fields,
          filter,
          include,
          page,
          sort: {
            addresses: { country: 'ASC' },
            target: { login: 'DESC' },
          },
        },
      },
    });

    expect(joinSpy).toBeCalledTimes(2);
    expect(joinSpy).toHaveBeenNthCalledWith(1, 'users.manager', 'manager');
    expect(joinSpy).toHaveBeenNthCalledWith(2, 'users.addresses', 'addresses');
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith(`users.id`, 'subQueryId');
    expect(offsetSpy).toBeCalledTimes(1);
    expect(offsetSpy).toBeCalledWith((page.number - 1) * page.size);
    expect(limitSpy).toBeCalledTimes(1);
    expect(limitSpy).toBeCalledWith(page.size);
    expect(orderBySpy).toBeCalledTimes(1);
    expect(orderBySpy).toBeCalledWith({
      ['addresses.country']: 'ASC',
      ['users.login']: 'DESC',
    });
    expect(applyQueryFilterRelationSpy).toBeCalledTimes(1);
    expect(applyQueryFiltersTargetSpy).toBeCalledTimes(1);

    expect(result.meta).not.toHaveProperty('debug.prepareParams');
    expect(result.meta).not.toHaveProperty('debug.callQuery');
    expect(result.meta).not.toHaveProperty('debug.transform');

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('included');

    expect(result.meta.pageNumber).toBe(page.number);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.pageSize).toBe(page.size);

    expect(resultJoinSpy).toBeCalledTimes(4);
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      1,
      `users.${include[0]}`,
      include[0]
    );
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      2,
      `users.${include[1]}`,
      include[1]
    );
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      3,
      `users.${include[2]}`,
      include[2]
    );
    expect(resultJoinSpy).toHaveBeenNthCalledWith(
      4,
      `users.${include[3]}`,
      include[3]
    );

    expect(resultSelectSpy).toBeCalledTimes(1);
    expect(resultSelectSpy).toBeCalledWith([
      ...include.map((i) => `${i}.id`),
      ...fields.target.map((i) => `users.${i}`),
      'users.id',
      ...fields.manager.map((i) => `manager.${i}`),
      ...fields.comments.map((i) => `comments.${i}`),
    ]);
  });
});
