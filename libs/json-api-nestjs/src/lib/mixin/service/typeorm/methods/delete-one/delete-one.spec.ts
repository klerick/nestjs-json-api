import {transformMixin} from '../../../transform';
import {Addresses, mockDBTestModule, Users} from '../../../../../mock-utils';
import {
  CONFIG_PARAM_POSTFIX,
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE
} from '../../../../../constants';
import {typeormMixin} from '../../index';
import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import {getProviderName, snakeToCamel} from '../../../../../helper';
import {TypeormMixinService} from '../../typeorm.mixin';
import {ConfigParam, QueryField, QueryParams} from '../../../../../types';
import {NotFoundException} from '@nestjs/common';

describe('DeleteOne methode test', () => {
  const params = 1;
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

  it('should be not found', async () => {
    expect.assertions(1);
    configParam.requiredSelectField = false;
    try {
      await typeormService.deleteOne({query: defaultField, route: {id: 100}})
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException)
    }
  });

  it('should be ok', async () => {
    let whereSpy;
    const createQueryBuilderSpy = jest.spyOn(repository, 'createQueryBuilder').mockImplementationOnce((...alias) => {
      const builder = repository.createQueryBuilder(...alias);
      whereSpy = jest.spyOn(builder, 'where')

      return builder;
    });
    await typeormService.deleteOne({query: defaultField, route: {id: params}})
    expect(createQueryBuilderSpy).toBeCalled();
    expect(createQueryBuilderSpy).toBeCalledWith(snakeToCamel(repository.metadata.name));
    expect(whereSpy).toBeCalledTimes(1);
    expect(whereSpy).toBeCalledWith({id: params})
  })
})
