import {Test, TestingModule} from '@nestjs/testing';
import {getDataSourceToken, getRepositoryToken} from '@nestjs/typeorm';
import {NotFoundException} from '@nestjs/common';
import {DataSource, Repository} from 'typeorm';

import {TypeormMixinService} from '../../typeorm.mixin';
import {Addresses, mockDBTestModule, Roles, Users} from '../../../../../mock-utils';
import {ConfigParam} from '../../../../../types';
import {transformMixin} from '../../../transform';
import {CONFIG_PARAM_POSTFIX, DEFAULT_CONNECTION_NAME} from '../../../../../constants';
import {typeormMixin} from '../../index';
import {getProviderName} from '../../../../../helper';
import {ResourceRequestObject} from '../../../../../types-common/request';


describe('GetRelationship methode test', () => {

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
      roles: [roles]
    }))
  });

  beforeEach(async () => {
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be error not found', async () => {
    expect.assertions(2);
    try {
      await typeormService.getRelationship({ route: {id: 2, relName: 'roles'}});
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException)
      expect(e.response.detail).toBe(
        `Resource 'users' with id '2' does not exist`
      )
    }
  });

  it('Should be ok', async () => {
    const result = await typeormService.getRelationship({ route: {id: 1, relName: 'roles'}});
    expect(result.data).toEqual([{type: 'roles', id: '1'}])
  });
})
