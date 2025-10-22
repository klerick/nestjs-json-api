import { TestingModule } from '@nestjs/testing';
import {
  JsonApiTransformerService,
  ORM_SERVICE,
  PatchData,
  PostData,
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
import { faker } from '@faker-js/faker';
import { pullAddress, pullUser } from '../../mock-utils/pull-data';

describe('patchOne', () => {
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;

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
  let newData: PatchData<Users, 'id'>;

  let notes: Notes[];
  let users: Users[];
  let roles: Roles[];
  let userGroup: UserGroups[];
  let addresses: Addresses[];

  beforeEach(async () => {
    firstName = faker.person.firstName();
    isActive = false;
    login = faker.internet.username({
      lastName: firstName,
      firstName: faker.person.lastName(),
    });
    testDate = new Date();

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

    notes = await notesRepository.find();
    users = await userRepository.find();
    roles = await rolesRepository.find();
    userGroup = await userGroupRepository.find({
      relations: {
        users: true,
      },
    });
    addresses = [await pullAddress(addressesRepository)];
    const manager = await pullUser(userRepository);
    inputData = {
      type: 'users',
      attributes: {
        firstName,
        isActive,
        testDate,
        login,
      },
      relationships: {
        addresses: {
          data: {
            type: 'addresses',
            id: addresses[0].id.toString(),
          },
        },
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
            id: `${manager.id}`,
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

    await typeormService.postOne(inputData);

    const changeUser = await userRepository.findOneBy({
      login: inputData.attributes.login as string,
    });
    if (!changeUser) {
      throw new Error('not found mock data');
    }
    const newLogin = `${changeUser.login} - newLogin`;
    const newIsActive = !changeUser.isActive;
    newData = {
      ...inputData,
      id: `${changeUser.id}`,
      attributes: {
        ...(inputData.attributes || {}),
        ...{
          login: newLogin,
          isActive: newIsActive,
          testDate: new Date(),
        },
      },
    };

    newData.relationships = {
      ...newData.relationships,
      manager: {
        data: {
          type: 'users',
          id: users[1].id.toString(),
        },
      },
      addresses: {
        data: null,
      },
      userGroup: {
        data: {
          type: 'user-group',
          id: `${userGroup[1].id}`,
        },
      },
      roles: {
        data: [
          {
            type: 'roles',
            id: `${roles[1].id}`,
          },
        ],
      },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should be ok without relation', async () => {
    const spyOnTransformData = vi
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
      }));

    const { relationships, ...withoutRelationships } = newData;
    const returnData = await typeormService.patchOne(
      withoutRelationships.id as string,
      withoutRelationships
    );

    const result = await userRepository.findOneBy({
      id: parseInt(withoutRelationships.id as string, 10),
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

    const returnData = await typeormService.patchOne(
      newData.id as string,
      newData
    );

    const result = await userRepository.findOne({
      where: {
        id: parseInt(newData.id as string, 10),
      },
      relations: {
        addresses: true,
        notes: true,
        userGroup: true,
        roles: true,
        manager: true,
      },
    });

    expect(spyOnTransformData).toBeCalledWith(result, {
      fields: null,
      include: ['addresses', 'notes', 'roles', 'manager', 'userGroup'],
    });
    expect(returnData).toHaveProperty('included');
  });

  it('should be ok with relation nulling relation', async () => {
    const spyOnTransformData = vi
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
        included: {} as any,
      }));

    newData.relationships = {
      userGroup: {
        data: null,
      },
      roles: {
        data: [],
      },
    } as any;

    const returnData = await typeormService.patchOne(
      newData.id as string,
      newData
    );

    const result = await userRepository.findOne({
      where: {
        id: parseInt(newData.id as string, 10),
      },
      relations: {
        userGroup: true,
        roles: true,
      },
    });

    expect(spyOnTransformData).toBeCalledWith(result, {
      fields: null,
      include: ['userGroup', 'roles'],
    });
    expect(returnData).toHaveProperty('included');
  });
});
