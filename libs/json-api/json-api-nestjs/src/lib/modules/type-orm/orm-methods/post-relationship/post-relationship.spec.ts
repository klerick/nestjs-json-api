import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { Repository } from 'typeorm';

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
  ORM_SERVICE,
} from '../../../../constants';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../../factory';
import {
  EntityPropsMapService,
  TypeOrmService,
  TransformDataService,
  TypeormUtilsService,
} from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';

describe('postRelationship', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: TransformDataService<Users>;
  let typeormUtilsService: TypeormUtilsService<Users>;
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
    typeormUtilsService =
      module.get<TypeormUtilsService<Users>>(TypeormUtilsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be ok', async () => {
    const checkUser = await userRepository.findOne({
      select: {
        id: true,
        roles: {
          id: true,
        },
        userGroup: {
          id: true,
        },
        manager: {
          id: true,
        },
      },
      where: { id: 1 },
      relations: {
        roles: true,
        manager: true,
        userGroup: true,
      },
    });

    const roles = await rolesRepository.find();
    const userGroups = await userGroupRepository.find();
    const users = await userRepository.find();

    if (!checkUser) {
      throw new Error('not found mock');
    }

    const userGroupData = {
      type: 'user-groups',
      id: userGroups
        .find((i) => checkUser.userGroup.id !== i.id)
        ?.id.toString(),
    };
    const rolesData = [
      {
        type: 'roles',
        id: roles
          .find((i) => checkUser.roles.find((a) => a.id !== i.id))
          ?.id.toString(),
      },
    ];

    const managerData = {
      type: 'users',
      id: users.find((i) => checkUser.manager.id !== i.id)?.id.toString(),
    };
    const result = await typeormService.postRelationship(
      1,
      'roles',
      rolesData as any
    );
    const result1 = await typeormService.postRelationship(
      1,
      'userGroup',
      userGroupData as any
    );

    const result2 = await typeormService.postRelationship(
      1,
      'manager',
      managerData as any
    );

    const checkUserAfterPost = await userRepository.findOne({
      select: {
        id: true,
        roles: {
          id: true,
        },
        userGroup: {
          id: true,
        },
        manager: {
          id: true,
        },
      },
      where: { id: 1 },
      relations: {
        roles: true,
        manager: true,
        userGroup: true,
      },
    });
    if (!checkUserAfterPost) {
      throw new Error('not found');
    }

    expect(checkUserAfterPost.manager.id.toString()).toBe(managerData.id);
    expect(checkUserAfterPost.roles.map((i) => i.id.toString())).toEqual([
      ...checkUser.roles.map((i) => i.id.toString()),
      ...rolesData.map((i) => i.id),
    ]);
    expect(checkUserAfterPost.userGroup.id.toString()).toBe(userGroupData.id);

    expect(result.data.map((i) => i.id)).toEqual(
      checkUserAfterPost.roles.map((i) => i.id.toString())
    );
    expect(result2.data?.id).toEqual(checkUserAfterPost.manager.id.toString());
    expect(result1.data?.id).toEqual(
      checkUserAfterPost.userGroup.id.toString()
    );
  });
});
