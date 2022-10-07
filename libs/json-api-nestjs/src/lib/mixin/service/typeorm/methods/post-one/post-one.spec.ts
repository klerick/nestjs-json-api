import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { transformMixin } from '../../../transform';
import {
  Addresses,
  mockDBTestModule,
  Users,
  Roles,
  Comments,
} from '../../../../../mock-utils';
import {
  CONFIG_PARAM_POSTFIX,
  DEFAULT_CONNECTION_NAME,
} from '../../../../../constants';
import { typeormMixin } from '../../index';
import { getProviderName } from '../../../../../helper';
import { TypeormMixinService } from '../../typeorm.mixin';
import { ConfigParam } from '../../../../../types';
import { ResourceRequestObject } from '../../../../../types-common/request';
import { NotFoundException } from '@nestjs/common';

describe('PostOne methode test', () => {
  let typeormService: TypeormMixinService<Users>;
  let configParam: ConfigParam;
  let repository: Repository<Users>;

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

    await repository.manager.getRepository(Addresses).save(
      Object.assign(new Addresses(), {
        country: 'country',
        state: 'state',
      })
    );

    await repository.manager.getRepository(Roles).save(
      Object.assign(new Roles(), {
        name: 'user',
        key: 'USER',
        isDefault: true,
      })
    );
  });

  beforeEach(async () => {
    configParam.debug = true;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be error', async () => {
    const body: ResourceRequestObject<Users>['data'] = {
      attributes: {
        login: 'test',
        isActive: true,
        lastName: 'lastName',
        firstName: 'firstName',
        testDate: new Date(),
      },
      relationships: {
        addresses: {
          data: {
            type: 'addresses',
            id: '4',
          },
        },
      },
    } as any;
    expect.assertions(2);
    try {
      await typeormService.postOne({ body });
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e.response.detail).toBe(
        `Resource 'addresses' with id '${body.relationships.addresses.data.id}' does not exist`
      );
    }
  });

  it('Should be error, array relation', async () => {
    const body: ResourceRequestObject<Users>['data'] = {
      attributes: {
        login: 'test',
        isActive: true,
        lastName: 'lastName',
        firstName: 'firstName',
        testDate: new Date(),
      },
      relationships: {
        roles: {
          data: [
            {
              type: 'roles',
              id: '4',
            },
            {
              type: 'roles',
              id: '5',
            },
          ],
        },
      },
    } as any;
    expect.assertions(2);
    try {
      await typeormService.postOne({ body });
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e.response.detail).toBe(
        `Resource 'roles' with ids '${body.relationships.roles.data
          .map((i) => i.id)
          .join(',')}' does not exist`
      );
    }
  });

  it('Should be error, not exist relation', async () => {
    const body: ResourceRequestObject<Users>['data'] = {
      attributes: {
        login: 'test',
        isActive: true,
        lastName: 'lastName',
        firstName: 'firstName',
        testDate: new Date(),
      },
      relationships: {
        addresseses: {
          data: {
            type: 'addresseses',
            id: '4',
          },
        },
      },
    } as any;
    expect.assertions(2);
    try {
      await typeormService.postOne({ body });
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect(e.response.detail).toBe(
        `Resource for props 'addresseses' does not exist`
      );
    }
  });

  it('Should be ok', async () => {
    const body: ResourceRequestObject<Users>['data'] = {
      attributes: {
        login: 'test',
        isActive: true,
        lastName: 'lastName',
        firstName: 'firstName',
        testDate: new Date(),
      },
      relationships: {
        addresses: {
          data: {
            type: 'addresses',
            id: '1',
          },
        },
      },
    } as any;
    const result = await typeormService.postOne({ body });
    const { createdAt, updatedAt, ...attributes } = result.data['attributes'];
    expect(attributes).toEqual(body.attributes);
    const checkData = await repository.findOne({
      where: {
        id: result.data['id'],
      },
      relations: {
        addresses: true,
      },
    });

    expect(checkData.addresses.id).toEqual(
      parseInt(body.relationships.addresses.data.id, 10)
    );
  });
});
