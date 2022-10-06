import {TypeormMixinService} from '../../typeorm.mixin';
import {Addresses, mockDBTestModule, Roles, Users, Comments, CommentKind} from '../../../../../mock-utils';
import {ConfigParam} from '../../../../../types';
import {DataSource, Repository} from 'typeorm';
import {transformMixin} from '../../../transform';
import {CONFIG_PARAM_POSTFIX, DEFAULT_CONNECTION_NAME} from '../../../../../constants';
import {typeormMixin} from '../../index';
import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {getProviderName} from '../../../../../helper';

describe('PostRelationship methode test', () => {

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

    await repository.manager.getRepository(Comments).save(Object.assign(new Comments(), {text: 'text', kind: CommentKind.Note}))

    await repository.save(Object.assign(new Users(), {
      login: 'test',
      isActive: true,
      lastName: 'lastName',
      firstName: 'firstName',
      testDate: new Date(),
      addresses: addresses,
    }))
  });

  beforeEach(async () => {
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be ok, with array', async () => {
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
    await typeormService.postRelationship(dataRequest);
    const result = await repository.findOne({
      relations: {
        roles: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    expect(resultBefore.roles.length).toBe(0)
    expect(result.roles.length).toBe(1);
    expect(result.roles[0].id).toBe(parseInt(dataRequest.body[0].id, 10));
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

    await typeormService.postRelationship(dataRequest);

    const result = await repository.findOne({
      relations: {
        manager: true
      },
      where: {
        id: dataRequest.route.id
      }
    })

    expect(resultBefore.manager).toBe(null)
    expect(result.manager).not.toBe(null)
    expect(result.manager.id).toBe(parseInt(dataRequest.body.id, 10))
  });

  it('Should be ok, ManyToOne', async () => {
    const dataRequest = {
      route: {id: 1, relName: 'createdBy'},
      body: {type: 'users', id: '1'} as any
    }
    const beforeResult = await repository.manager.getRepository(Comments).find({
      relations: {
        createdBy: true
      },
      where: {
        id: dataRequest.route.id
      }
    })
    const resultData = await typeormServiceComments.postRelationship(dataRequest);


    const result = await repository.manager.getRepository(Comments).find({
      relations: {
        createdBy: true
      },
      where: {
        id: dataRequest.route.id
      }
    });
    expect(beforeResult[0].createdBy).toBe(null)
    expect(result[0].createdBy).not.toBe(null)
    expect(result[0].createdBy.id).toBe(parseInt(dataRequest.body.id, 10))
    expect(resultData).toEqual({data: dataRequest.body})
  })

})
