import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { Repository } from 'typeorm';

import {
  Addresses,
  Comments,
  createAndPullSchemaBase,
  getRepository,
  mockDBTestModule,
  Notes,
  providerEntities,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../../../mock-utils';

import {
  CONTROL_OPTIONS_TOKEN,
  DEFAULT_CONNECTION_NAME,
  ORM_SERVICE,
} from '../../../../constants';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../../factory';

import { NotFoundException } from '@nestjs/common';
import {
  EntityPropsMapService,
  TypeOrmService,
  TransformDataService,
  TypeormUtilsService,
} from '../../service';

describe('getRelationship', () => {
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

  it('Should be ok', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'getRelationships'
    );
    const id = 1;
    const rel = 'roles';
    const check = await userRepository.findOne({
      select: {
        id: true,
        roles: {
          id: true,
        },
      },
      where: { id },
      relations: {
        roles: true,
      },
    });
    const result = await typeormService.getRelationship(id, rel);
    expect(spyOnTransformData).toBeCalledWith(check, rel);
    expect(result).toHaveProperty('data');
  });
  it('Should be error', async () => {
    expect.assertions(1);
    try {
      await typeormService.getRelationship('1000000', 'roles');
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
    }
  });
});
