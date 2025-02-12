import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { Repository } from 'typeorm';

import {
  Addresses,
  Comments,
  entities,
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
  CURRENT_ENTITY,
  DEFAULT_CONNECTION_NAME,
  ORM_SERVICE,
} from '../../../../constants';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  EntityPropsMap,
  OrmServiceFactory,
} from '../../factory';
import { TypeOrmService, TypeormUtilsService } from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';
import { JsonApiTransformerService } from '../../../mixin/service/json-api-transformer.service';

describe('patchRelationship', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;
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
        {
          provide: CURRENT_ENTITY,
          useValue: Users,
        },
        EntityPropsMap(entities as any),
        CurrentEntityManager(),
        CurrentEntityRepository(Users),
        TypeormUtilsService,
        JsonApiTransformerService,
        OrmServiceFactory(),
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
    transformDataService = module.get<JsonApiTransformerService<Users>>(
      JsonApiTransformerService
    );
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
    const result = await typeormService.patchRelationship(
      1,
      'roles',
      rolesData as any
    );
    const result1 = await typeormService.patchRelationship(
      1,
      'userGroup',
      userGroupData as any
    );
    const result2 = await typeormService.patchRelationship(
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
    expect(checkUserAfterPost.roles.map((i) => i.id.toString())).toEqual(
      rolesData.map((i) => i.id)
    );
    expect(checkUserAfterPost.userGroup.id.toString()).toBe(userGroupData.id);

    await typeormService.patchRelationship(1, 'roles', []);
    await typeormService.patchRelationship(1, 'manager', null);
    const checkUserAfterPatch = await userRepository.findOne({
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
    if (!checkUserAfterPatch) {
      throw new Error('not found');
    }

    expect(checkUserAfterPatch.manager).toBe(null);
    expect(checkUserAfterPatch.roles).toEqual([]);
    expect(result.data.map((i) => i.id)).toEqual(
      checkUserAfterPost.roles.map((i) => i.id.toString())
    );
    expect(result2.data?.id).toEqual(checkUserAfterPost.manager.id.toString());
    expect(result1.data?.id).toEqual(
      checkUserAfterPost.userGroup.id.toString()
    );
  });
});
