import {
  JsonApiTransformerService,
  ORM_SERVICE,
} from '@klerick/json-api-nestjs';
import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

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

describe('getRelationship', () => {
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

  it('Should be ok', async () => {
    const spyOnTransformData = jest.spyOn(transformDataService, 'transformRel');
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
