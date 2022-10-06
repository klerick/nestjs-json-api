import {TypeormMixinService} from '../../typeorm.mixin';
import {Addresses, mockDBTestModule, Roles, Users} from '../../../../../mock-utils';
import {ConfigParam} from '../../../../../types';
import {DataSource, Repository} from 'typeorm';
import {transformMixin} from '../../../transform';
import {CONFIG_PARAM_POSTFIX, DEFAULT_CONNECTION_NAME} from '../../../../../constants';
import {typeormMixin} from '../../index';
import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {getProviderName} from '../../../../../helper';

describe('DeleteRelationship methode test', () => {

  let typeormService: TypeormMixinService<Users>;
  let configParam: ConfigParam;
  let repository: Repository<Users>;

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

    const manager = await repository.save(Object.assign(new Users(), {
      login: 'testmanager',
      isActive: true,
      lastName: 'lastNamemanager',
      firstName: 'firstNamemanager',
      testDate: new Date(),
      addresses: addresses,
    }))

    const roles = await repository.manager.getRepository(Roles).save(Object.assign(new Roles(), {
      name: 'user',
      key: 'USER',
      isDefault: true
    }));

    await repository.save(Object.assign(new Users(), {
      login: 'test',
      isActive: true,
      lastName: 'lastName',
      firstName: 'firstName',
      testDate: new Date(),
      addresses: addresses,
      roles: [roles],
      manager: manager
    }))
  });

  beforeEach(async () => {
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be ok rel is array', async () => {
    const dataRequest = {
      route: {id: 2, relName: 'roles'},
      body: [{type: 'roles', id: '1'}] as any
    }
    const resultBefore = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    await typeormService.deleteRelationship(dataRequest);
    const result = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    expect(resultBefore.roles.length).toBe(1)
    expect(result.roles.length).toBe(0)
  });

  it('Should be ok rel is object', async () => {
    const dataRequest = {
      route: {id: 2, relName: 'manager'},
      body: {type: 'users', id: '1'} as any
    }
    const resultBefore = await repository.findOne({
      relations: {
        manager: true
      },
      where: {
        id: dataRequest.route.id
      }
    })

    await typeormService.deleteRelationship(dataRequest);

    const result = await repository.findOne({
      relations: {
        manager: true
      },
      where: {
        id: dataRequest.route.id
      }
    })

    expect(resultBefore.manager).not.toBe(null)
    expect(result.manager).toBe(null)
  });
})
