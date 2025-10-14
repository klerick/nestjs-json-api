import { TestingModule } from '@nestjs/testing';
import {
  ORM_SERVICE,
  PostData,
  ENTITY_PARAM_MAP,
} from '@klerick/json-api-nestjs';
import { Repository } from 'typeorm';

import { TypeOrmService } from './type-orm.service';
import { TypeormUtilsService } from './typeorm-utils.service';
import { TypeOrmFormatErrorService } from './type-orm-format.error.service';

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
} from '../mock-utils';
import { ConflictException } from '@nestjs/common';

describe('getOne', () => {
  let typeormService: TypeOrmService<Users>;
  let typeOrmFormatErrorService: TypeOrmFormatErrorService;
  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;
  let users: Users[];
  let firstUsers: Users;

  beforeAll(async () => {
    const module: TestingModule = await getModuleForPgLite(
      Users,
      dbRandomName(),
      TypeormUtilsService,
      {
        provide: TypeOrmFormatErrorService,
        useClass: TypeOrmFormatErrorService,
      },
      {
        provide: ENTITY_PARAM_MAP,
        useValue: {
          keys() {
            return [Users];
          },
        },
      }
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
    typeOrmFormatErrorService = module.get<TypeOrmFormatErrorService>(
      TypeOrmFormatErrorService
    );
    users = await userRepository.find();
    const tmpFirstUser = users.at(0);
    if (!tmpFirstUser) throw new Error('No first user');
    firstUsers = tmpFirstUser;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('Format error duplicate error', async () => {
    const { id, userGroup, manager, roles, addresses, ...other } = firstUsers;

    const userPost: PostData<Users, 'id'> = {
      type: 'users',
      attributes: other,
    };
    try {
      await typeormService.postOne(userPost);
    } catch (error) {
      expect(typeOrmFormatErrorService.formatError(error)).toBeInstanceOf(
        ConflictException
      );
    }
  });
});
