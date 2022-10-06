import {TypeormMixinService} from '../../typeorm.mixin';
import {Addresses, CommentKind, Comments, mockDBTestModule, Roles, Users} from '../../../../../mock-utils';
import {ConfigParam} from '../../../../../types';
import {DataSource, Repository} from 'typeorm';
import {transformMixin} from '../../../transform';
import {CONFIG_PARAM_POSTFIX, DEFAULT_CONNECTION_NAME} from '../../../../../constants';
import {typeormMixin} from '../../index';
import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {getProviderName} from '../../../../../helper';

describe('PatchRelationship methode test', () => {

  let typeormService: TypeormMixinService<Users>;
  let typeormServiceComments: TypeormMixinService<Comments>;
  let configParam: ConfigParam;
  let repository: Repository<Users>;

  beforeAll(async () => {

    const transformMixinService = transformMixin(Users, DEFAULT_CONNECTION_NAME);
    const typeormMixinService = typeormMixin(Users, DEFAULT_CONNECTION_NAME, transformMixinService);
    const transformMixinServiceComments = transformMixin(Comments, DEFAULT_CONNECTION_NAME);
    const typeormMixinServiceComments = typeormMixin(Comments, DEFAULT_CONNECTION_NAME, transformMixinServiceComments);
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        mockDBTestModule(),
      ],
      providers: [
        transformMixinService,
        typeormMixinService,
        transformMixinServiceComments,
        typeormMixinServiceComments,
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
          provide: getRepositoryToken(Comments, DEFAULT_CONNECTION_NAME),
          useFactory(dataSource: DataSource) {
            return dataSource.getRepository<Comments>(Comments)
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
        },
        {
          provide: getProviderName(Comments, CONFIG_PARAM_POSTFIX),
          useValue: {
            requiredSelectField: false,
            debug: false,
            maxExecutionTime: 1000
          }
        }
      ]
    }).compile();

    typeormService = module.get<TypeormMixinService<Users>>(typeormMixinService);
    typeormServiceComments = module.get<TypeormMixinService<Comments>>(typeormMixinServiceComments);
    configParam = module.get<ConfigParam>(getProviderName(Users, CONFIG_PARAM_POSTFIX))
    repository = module.get<Repository<Users>>(getRepositoryToken(Users, DEFAULT_CONNECTION_NAME));

    const addresses = await repository.manager.getRepository(Addresses).save(Object.assign(new Addresses(), {
      country: 'country',
      state: 'state'
    }))

    const addresses1 = await repository.manager.getRepository(Addresses).save(Object.assign(new Addresses(), {
      country: 'country1',
      state: 'state1'
    }))

    const roles = await repository.manager.getRepository(Roles).save(Object.assign(new Roles(), {
      name: 'user',
      key: 'USER',
      isDefault: true,
    }));

    const roles2 = await repository.manager.getRepository(Roles).save(Object.assign(new Roles(), {
      name: 'user2',
      key: 'USER2',
      isDefault: true,
    }));

    await repository.manager.getRepository(Comments).save(Object.assign(new Comments(), {
      text: 'text',
      kind: CommentKind.Note
    }))

    const manager = await repository.save(Object.assign(new Users(), {
      login: 'testmanager',
      isActive: true,
      lastName: 'lastNamemanager',
      firstName: 'firstNamemanager',
      testDate: new Date(),
      addresses: addresses,
      roles: [roles]
    }))

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

  it('should be update', async () => {
    const dataRequest = {
      route: {id: 2, relName: 'roles'},
      body: [{type: 'roles', id: '2'}] as any
    }
    const resultBefore = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    await typeormService.patchRelationship(dataRequest)
    const result = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    expect(resultBefore.roles.length).toBe(1);
    expect(resultBefore.roles[0].id).toBe(result.roles[0].id);
    expect(result.roles[1].id).toBe(parseInt(dataRequest.body[0].id));
    expect(result.roles.length).toBe(2);
  })
  it('should be update removed', async () => {
    const dataRequest = {
      route: {id: 1, relName: 'roles'},
      body: [] as any
    }
    const resultBefore = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    await typeormService.patchRelationship(dataRequest)
    const result = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    expect(resultBefore.roles.length).toBe(1);
    expect(result.roles.length).toBe(1);
  })

  it('Should be update object', async () => {
    const dataRequest = {
      route: {id: 1, relName: 'addresses'},
      body: {type: 'addresses', id: '2'} as any
    }
    const resultBefore = await repository.findOne({
      relations: {
        addresses: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    await typeormService.patchRelationship(dataRequest)
    const result = await repository.findOne({
      relations: {
        addresses: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    expect(resultBefore.addresses.id).not.toBe(result.addresses.id);
    expect(result.addresses.id).toBe(parseInt(dataRequest.body.id, 10));

    dataRequest.body = null
    dataRequest.route.relName = 'manager'
    await typeormService.patchRelationship(dataRequest)
    const resultEmpty = await repository.findOne({
      relations: {
        manager: true
      },
      where: {
        id: dataRequest.route.id
      }
    })

    expect(resultEmpty.manager).toBe(null);
  })
})
