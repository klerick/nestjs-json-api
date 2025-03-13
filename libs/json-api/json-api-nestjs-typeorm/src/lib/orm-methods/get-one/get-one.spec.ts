import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  JsonApiTransformerService,
  ORM_SERVICE,
} from '@klerick/json-api-nestjs';

import { Equal, Repository } from 'typeorm';

import { TypeOrmService, TypeormUtilsService } from '../../service';

import {
  dbRandomName,
  getModuleForPgLite,
  getDefaultQuery,
  Addresses,
  Comments,
  getRepository,
  Notes,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../mock-utils';

describe('getOne', () => {
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  beforeAll(async () => {
    const module: TestingModule = await getModuleForPgLite(
      Users,
      dbRandomName(),
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
    typeormService = module.get<TypeOrmService<Users>>(ORM_SERVICE);
    transformDataService = module.get<JsonApiTransformerService<Users>>(
      JsonApiTransformerService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Get one item', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'transformData'
    );
    const query = getDefaultQuery<Users>();
    const checkData = await userRepository.findOne({
      where: {
        id: Equal(1),
      },
      relations: {
        addresses: true,
        comments: true,
      },
    });
    query.include = ['addresses', 'comments'];
    await typeormService.getOne('1', query);
    expect(spyOnTransformData).toBeCalledWith(checkData, query);
  });
  it('Get one item with select', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'transformData'
    );
    const query = getDefaultQuery<Users>();
    const checkData = await userRepository.findOne({
      select: {
        firstName: true,
        id: true,
        isActive: true,
        comments: {
          id: true,
          text: true,
        },
        addresses: {
          id: true,
        },
        manager: {
          id: true,
          login: true,
        },
      },
      where: {
        id: Equal(1),
      },
      relations: {
        addresses: true,
        comments: true,
        manager: true,
      },
    });
    query.include = ['addresses', 'comments', 'manager'];
    query.fields = {
      target: ['firstName', 'isActive'],
      comments: ['text'],
      manager: ['login'],
    };
    await typeormService.getOne('1', query);
    expect(spyOnTransformData).toBeCalledWith(checkData, query);
  });
  it('Should be error', async () => {
    expect.assertions(1);
    try {
      const query = getDefaultQuery<Users>();
      await typeormService.getOne('1000000', query);
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
    }
  });
});
