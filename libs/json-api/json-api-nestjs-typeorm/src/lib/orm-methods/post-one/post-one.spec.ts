import { TestingModule } from '@nestjs/testing';
import {
  JsonApiTransformerService,
  ORM_SERVICE,
  PostData,
} from '@klerick/json-api-nestjs';
import { Repository } from 'typeorm';

import { TypeOrmService, TypeormUtilsService } from '../../service';
import {
  Addresses,
  dbRandomName,
  getModuleForPgLite,
  Comments,
  getRepository,
  Notes,
  Pods,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../mock-utils';
import { faker } from '@faker-js/faker';
import { pullUser } from '../../mock-utils/pull-data';

describe('postOne', () => {
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;
  let podsRepository: Repository<Pods>;
  //
  let typeormServicePods: TypeOrmService<Pods>;
  let transformDataServicePods: JsonApiTransformerService<Pods>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  let firstName: string;
  let isActive: boolean;
  let testDate: Date;
  let login: string;

  let inputData: PostData<Users, 'id'>;

  let notes: Notes[];
  let users: Users[];
  let roles: Roles[];
  let userGroup: UserGroups[];

  beforeEach(async () => {
    const dbName = dbRandomName();
    const module: TestingModule = await getModuleForPgLite(
      Users,
      dbName,
      TypeormUtilsService
    );
    firstName = faker.person.firstName();
    isActive = false;
    login = faker.internet.username({
      lastName: firstName,
      firstName: faker.person.lastName(),
    });
    testDate = new Date();

    const modulePods: TestingModule = await getModuleForPgLite(
      Pods,
      dbName,
      TypeormUtilsService
    );

    ({
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository,
      podsRepository,
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

    typeormServicePods = modulePods.get<TypeOrmService<Pods>>(ORM_SERVICE);
    transformDataServicePods = modulePods.get<JsonApiTransformerService<Pods>>(
      JsonApiTransformerService
    );

    notes = await notesRepository.find();
    users = await userRepository.find();
    roles = await rolesRepository.find();
    userGroup = await userGroupRepository.find();

    inputData = {
      type: 'users',
      attributes: {
        firstName,
        isActive,
        testDate,
        login,
      },
      relationships: {
        notes: {
          data: [
            {
              type: 'notes',
              id: notes[0].id,
            },
          ],
        },
        roles: {
          data: [
            {
              type: 'roles',
              id: `${roles[0].id}`,
            },
          ],
        },
        manager: {
          data: {
            type: 'users',
            id: `${users[0].id}`,
          },
        },
        userGroup: {
          data: {
            type: 'user-group',
            id: `${userGroup[0].id}`,
          },
        },
      },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should be ok without relation and with id', async () => {
    const spyOnTransformData = vi
      .spyOn(transformDataServicePods, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
      }));
    const { relationships, ...other } = inputData;
    const id = '5';
    const returnData = await typeormServicePods.postOne({
      id,
      type: 'pods',
      attributes: {
        name: 'test',
      },
    } as any);
    const result = await podsRepository.findOneBy({
      id,
    });

    expect(spyOnTransformData).toBeCalledWith(
      {
        ...result,
        id,
      },
      { fields: null, include: [] }
    );
    expect(returnData).not.toHaveProperty('included');
  });

  it('should be ok without relation', async () => {
    const spyOnTransformData = vi
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
      }));
    const { relationships, ...other } = inputData;
    const returnData = await typeormService.postOne(other);
    const result = await userRepository.findOneBy({
      login,
    });

    expect(spyOnTransformData).toBeCalledWith(result, {
      fields: null,
      include: [],
    });
    expect(returnData).not.toHaveProperty('included');
  });

  it('should be ok with relation', async () => {
    const spyOnTransformData = vi
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
        included: {} as any,
      }));
    const users = await pullUser(userRepository);
    const returnData = await typeormService.postOne({
      ...inputData,
      relationships: {
        ...inputData.relationships,
        manager: {
          data: {
            type: 'users',
            id: `${users.id}`,
          },
        },
      } as any,
    });
    const result = await userRepository.findOne({
      where: {
        login,
      },
      relations: {
        notes: true,
        userGroup: true,
        roles: true,
        manager: true,
      },
    });

    expect(spyOnTransformData).toBeCalledWith(result, {
      fields: null,
      include: ['notes', 'roles', 'manager', 'userGroup'],
    });
    expect(returnData).toHaveProperty('included');
  });
});
