import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryField } from '@klerick/json-api-nestjs-shared';
import { IMemoryDb } from 'pg-mem';
import { Equal, Repository } from 'typeorm';

import { ObjectLiteral as Entity } from '../../../../types';
import {
  Addresses,
  Comments,
  getRepository,
  mockDBTestModule,
  Notes,
  providerEntities,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../../../mock-utils/typeorm';

import {
  CONTROL_OPTIONS_TOKEN,
  DEFAULT_CONNECTION_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE,
  ORM_SERVICE,
} from '../../../../constants';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../../factory';
import { Query } from '../../../mixin/zod';
import { NotFoundException } from '@nestjs/common';
import {
  EntityPropsMapService,
  TypeOrmService,
  TransformDataService,
  TypeormUtilsService,
} from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';

function getDefaultQuery<R extends Entity>() {
  const defaultQuery: Query<R> = {
    [QueryField.filter]: {
      relation: null,
      target: null,
    },
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: DEFAULT_PAGE_SIZE,
      number: DEFAULT_QUERY_PAGE,
    },
  };

  return defaultQuery;
}

describe('getOne', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: TransformDataService<Users>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        {
          provide: CONTROL_OPTIONS_TOKEN,
          useValue: {
            requiredSelectField: false,
            debug: false,
          },
        },
        CurrentEntityManager(),
        CurrentEntityRepository(Users),
        TypeormUtilsService,
        TransformDataService,
        OrmServiceFactory(),
        EntityPropsMapService,
      ],
    }).compile();
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
    transformDataService =
      module.get<TransformDataService<Users>>(TransformDataService);
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
    expect(spyOnTransformData).toBeCalledWith(checkData);
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
    expect(spyOnTransformData).toBeCalledWith(checkData);
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
