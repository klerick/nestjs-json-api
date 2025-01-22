import { Test, TestingModule } from '@nestjs/testing';
import { IBackup, IMemoryDb } from 'pg-mem';
import { getDataSourceToken } from '@nestjs/typeorm';
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
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../../factory';
import {
  CONTROL_OPTIONS_TOKEN,
  DEFAULT_CONNECTION_NAME,
  ORM_SERVICE,
} from '../../../../constants';

import { PatchData, PostData } from '../../../mixin/zod';
import {
  EntityPropsMapService,
  TypeOrmService,
  TransformDataService,
  TypeormUtilsService,
} from '../../service';

describe('patchOne', () => {
  let db: IMemoryDb;
  let backaUp: IBackup;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: TransformDataService<Users>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  const firstName = 'firstName test';
  const isActive = false;
  const testDate = new Date();
  const login = 'login test';

  let inputData: PostData<Users>;
  let newData: PatchData<Users>;

  let notes: Notes[];
  let users: Users[];
  let roles: Roles[];
  let userGroup: UserGroups[];
  let addresses: Addresses[];

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

    notes = await notesRepository.find();
    users = await userRepository.find();
    roles = await rolesRepository.find();
    userGroup = await userGroupRepository.find({
      relations: {
        users: true,
      },
    });
    addresses = await addressesRepository.find();

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
    };

    await typeormService.postOne(inputData);
    backaUp = db.backup();
    const changeUser = await userRepository.findOneBy({
      login: inputData.attributes.login as string,
    });
    if (!changeUser) {
      throw new Error('not found mock data');
    }
    newData = {
      ...inputData,
      id: `${changeUser.id}`,
    };
    const newLogin = `${changeUser.login} - newLogin`;
    const newIsActive = !changeUser.isActive;

    newData.attributes.login = newLogin;
    newData.attributes.isActive = newIsActive;
    newData.attributes.testDate = new Date();

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
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    backaUp.restore();
  });

  it('should be ok without relation', async () => {
    const spyOnTransformData = jest
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
    expect(spyOnTransformData).toBeCalledWith(result);
    expect(returnData).not.toHaveProperty('included');
  });

  it('should be ok with relation', async () => {
    const spyOnTransformData = jest
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

    expect(spyOnTransformData).toBeCalledWith(result);
    expect(returnData).toHaveProperty('included');
  });

  it('should be ok with relation nulling relation', async () => {
    const spyOnTransformData = jest
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
        included: {} as any,
      }));

    newData.relationships = {
      ...newData.relationships,
      userGroup: {
        data: null,
      },
      roles: {
        data: [],
      },
    };

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

    expect(spyOnTransformData).toBeCalledWith(result);
    expect(returnData).toHaveProperty('included');
  });
});
