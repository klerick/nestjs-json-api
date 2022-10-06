import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {BadRequestException, NotFoundException} from '@nestjs/common';

import {TypeormMixinService} from '../../typeorm.mixin';
import {mockDBTestModule, Users, Addresses} from '../../../../../mock-utils';
import {ConfigParam, QueryField, QueryParams} from '../../../../../types';
import {DataSource, Repository} from 'typeorm';
import {
  CONFIG_PARAM_POSTFIX,
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE
} from '../../../../../constants';
import {transformMixin} from '../../../transform';
import {typeormMixin} from '../../index';
import {snakeToCamel, getProviderName} from '../../../../../helper';


describe('GetOne methode test', () => {
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
      relation: null
    }
  };
  const params = 1;
  beforeAll(async () => {


    const transformMixinService = transformMixin(Users, DEFAULT_CONNECTION_NAME);
    const typeormMixinService = typeormMixin(Users, DEFAULT_CONNECTION_NAME, transformMixinService)
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [
        transformMixinService,
        typeormMixinService,
        {
          provide: getRepositoryToken(Users, DEFAULT_CONNECTION_NAME),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Users>(Users)
          },
          inject: [
            getDataSourceToken()
          ]
        },
        {
          provide: getProviderName(Users, CONFIG_PARAM_POSTFIX),
          useValue: {
            requiredSelectField: false,
            debug: false,
            maxExecutionTime: 1000
          }
        }
      ]
    }).compile();

    typeormService = module.get<TypeormMixinService<Users>>(typeormMixinService);
    configParam = module.get<ConfigParam>(getProviderName(Users, CONFIG_PARAM_POSTFIX))
    repository = module.get<Repository<Users>>(getRepositoryToken(Users, DEFAULT_CONNECTION_NAME));

    const addresses = await repository.manager.getRepository(Addresses).save(Object.assign(new Addresses(), {
      country: 'country',
      state: 'state'
    }))

    const user = {
      login: 'login',
      lastName: 'lastName',
      isActive: true,
      addresses: addresses
    }
    await repository.save(Object.assign(new Users(), user));
  });

  beforeEach(async () => {

    configParam.requiredSelectField = false;
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be error if requiredSelectField true', async () => {
    expect.assertions(3);
    configParam.requiredSelectField = true;
    try {
      await typeormService.getOne({query: defaultField, route: {id: params}})
    } catch (e) {
      const errorCount = e.response.message.length;
      expect(errorCount).toEqual(e.response.message.length);
      expect(errorCount).toBeGreaterThan(0);
      expect(e).toBeInstanceOf(BadRequestException)
    }
  })

  it('should be error if item not exist', async () => {
    expect.assertions(1);
    configParam.requiredSelectField = false;
    try {
      await typeormService.getOne({query: defaultField, route: {id: 100}})
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException)
    }
  })

  it ('Should be correct query', async () => {
    let joinSpy;
    let selectSpy;
    const createQueryBuilderSpy = jest.spyOn(repository, 'createQueryBuilder').mockImplementationOnce((...alias) => {
      const builder = repository.createQueryBuilder(...alias);
      joinSpy = jest.spyOn(builder, 'leftJoin')
      selectSpy = jest.spyOn(builder, 'select')
      return builder;
    });

    await typeormService.getOne({query: defaultField, route: {id: params}});
    expect(createQueryBuilderSpy).toBeCalled();
    expect(createQueryBuilderSpy).toBeCalledWith(snakeToCamel(repository.metadata.name));
    expect(joinSpy).toBeCalledTimes(0);
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith([`users`]);
  })

  it ('Should be correct query with include', async () => {
    let joinSpy;
    let selectSpy;
    const createQueryBuilderSpy = jest.spyOn(repository, 'createQueryBuilder').mockImplementationOnce((...alias) => {
      const builder = repository.createQueryBuilder(...alias);
      joinSpy = jest.spyOn(builder, 'leftJoin')
      selectSpy = jest.spyOn(builder, 'select')
      return builder;
    });
    // defaultField['fields'] = {
    //   target: ['lastName', 'isActive', 'firstName'],
    //   addresses: ['state', 'city']
    // }
    defaultField['include'] = ['addresses', 'roles']
    await typeormService.getOne({query: defaultField, route: {id: params}});
    expect(createQueryBuilderSpy).toBeCalled();
    expect(createQueryBuilderSpy).toBeCalledWith(snakeToCamel(repository.metadata.name));
    expect(joinSpy).toBeCalledTimes(2);
    expect(joinSpy).toHaveBeenNthCalledWith(1, `users.${defaultField['include'][0]}`, defaultField['include'][0])
    expect(joinSpy).toHaveBeenNthCalledWith(2, `users.${defaultField['include'][1]}`, defaultField['include'][1])
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith([ ...defaultField['include'], `users`]);
  })

  it ('Should be correct query with params', async () => {
    let joinSpy;
    let selectSpy;
    const createQueryBuilderSpy = jest.spyOn(repository, 'createQueryBuilder').mockImplementationOnce((...alias) => {
      const builder = repository.createQueryBuilder(...alias);
      joinSpy = jest.spyOn(builder, 'leftJoin')
      selectSpy = jest.spyOn(builder, 'select')
      return builder;
    });
    defaultField['fields'] = {
      target: ['lastName', 'isActive', 'firstName'],
      addresses: ['state', 'city']
    }
    defaultField['include'] = ['addresses']
    await typeormService.getOne({query: defaultField, route: {id: params}});
    expect(createQueryBuilderSpy).toBeCalled();
    expect(createQueryBuilderSpy).toBeCalledWith(snakeToCamel(repository.metadata.name));
    expect(joinSpy).toBeCalledTimes(1);
    expect(joinSpy).toHaveBeenNthCalledWith(1, `users.${defaultField['include'][0]}`, defaultField['include'][0])
    expect(selectSpy).toBeCalledTimes(1);
    expect(selectSpy).toBeCalledWith([
      `${defaultField['include'][0]}.id`,
      ...defaultField['fields']['target'].map(i => `users.${i}`),
      'users.id',
      ...defaultField['fields']['addresses'].map(i => `addresses.${i}`)
    ]);
  })
})
