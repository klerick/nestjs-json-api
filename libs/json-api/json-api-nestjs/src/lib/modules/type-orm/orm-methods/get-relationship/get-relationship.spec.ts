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

import { NotFoundException } from '@nestjs/common';
import { TypeOrmService, TypeormUtilsService } from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';
import { JsonApiTransformerService } from '../../../mixin/service/json-api-transformer.service';

describe('getRelationship', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;

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
