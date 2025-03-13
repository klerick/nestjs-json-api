import { TestingModule } from '@nestjs/testing';
import {
  JsonApiTransformerService,
  ORM_SERVICE,
} from '@klerick/json-api-nestjs';
import { Repository } from 'typeorm';

import { TypeOrmService, TypeormUtilsService } from '../../service';

import {
  dbRandomName,
  getModuleForPgLite,
  Addresses,
  Comments,
  getRepository,
  Notes,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../mock-utils';

describe('patchRelationship', () => {
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
    typeormUtilsService =
      module.get<TypeormUtilsService<Users>>(TypeormUtilsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Should be ok', async () => {
    jest
      .spyOn(transformDataService, 'transformRel')
      // @ts-ignore
      .mockImplementation((item, rel) => {
        if (Array.isArray(item[rel])) {
          return item[rel].map((i) => ({ id: i['id'] }));
        } else {
          return {
            id: item[rel] ? item[rel]['id'] : null,
          };
        }
      });

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
        .find((i) => checkUser.userGroup?.id !== i.id)
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
    await typeormService.patchRelationship(1, 'roles', rolesData as any);
    await typeormService.patchRelationship(
      1,
      'userGroup',
      userGroupData as any
    );
    await typeormService.patchRelationship(1, 'manager', managerData as any);

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

    const rolesPatchId = rolesData.map((i) => i.id);

    checkUserAfterPost.roles.find((i) =>
      rolesPatchId.includes(i.id.toString())
    );

    expect(
      checkUserAfterPost.roles
        .filter((i) => rolesPatchId.includes(i.id.toString()))
        .map((i) => i.id.toString())
    ).toEqual(rolesData.map((i) => i.id));
    expect(checkUserAfterPost.userGroup?.id.toString()).toBe(userGroupData.id);

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
  });
});
