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
  Pods,
  providerEntities,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../../../mock-utils';
import {
  CurrentDataSourceProvider,
  EntityRepositoryFactory,
  TypeormServiceFactory,
} from '../../../../factory';
import {
  CONTROL_OPTIONS_TOKEN,
  DEFAULT_CONNECTION_NAME,
  TYPEORM_SERVICE,
} from '../../../../constants';

import { TypeormService } from '../../../../types';
import { PostData } from '../../../../helper/zod';
import {
  TransformDataService,
  TypeormUtilsService,
} from '../../../../mixin/service';
import { EntityPropsMapService } from '../../../../service';

describe('postOne', () => {
  let db: IMemoryDb;
  let backaUp: IBackup;
  let typeormService: TypeormService<Users>;
  let transformDataService: TransformDataService<Users>;
  let podsRepository: Repository<Pods>;

  let typeormServicePods: TypeormService<Pods>;
  let transformDataServicePods: TransformDataService<Pods>;

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

  let notes: Notes[];
  let users: Users[];
  let roles: Roles[];
  let userGroup: UserGroups[];

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
        EntityRepositoryFactory(Users),
        TypeormUtilsService,
        TransformDataService,
        TypeormServiceFactory(Users),
        EntityPropsMapService,
      ],
    }).compile();

    const modulePods: TestingModule = await Test.createTestingModule({
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
        EntityRepositoryFactory(Pods),
        TypeormUtilsService,
        TransformDataService,
        TypeormServiceFactory(Pods),
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
    backaUp = db.backup();
    typeormService = module.get<TypeormService<Users>>(TYPEORM_SERVICE);
    transformDataService =
      module.get<TransformDataService<Users>>(TransformDataService);

    typeormServicePods = modulePods.get<TypeormService<Pods>>(TYPEORM_SERVICE);
    transformDataServicePods =
      modulePods.get<TransformDataService<Pods>>(TransformDataService);

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
        notes: [
          {
            type: 'notes',
            id: notes[0].id,
          },
        ],
        roles: [
          {
            type: 'roles',
            id: `${roles[0].id}`,
          },
        ],
        manager: {
          type: 'users',
          id: `${users[0].id}`,
        },
        userGroup: {
          type: 'user-group',
          id: `${userGroup[0].id}`,
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    backaUp.restore();
  });

  it('should be ok without relation and with id', async () => {
    const spyOnTransformData = jest
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
    });
    const result = await podsRepository.findOneBy({
      id,
    });

    expect(spyOnTransformData).toBeCalledWith({
      ...result,
      id,
    });
    expect(returnData).not.toHaveProperty('included');
  });

  it('should be ok without relation', async () => {
    const spyOnTransformData = jest
      .spyOn(transformDataService, 'transformData')
      .mockImplementationOnce(() => ({
        data: {} as any,
      }));
    const { relationships, ...other } = inputData;
    const returnData = await typeormService.postOne(other);
    const result = await userRepository.findOneBy({
      login,
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
    const returnData = await typeormService.postOne(inputData);
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

    expect(spyOnTransformData).toBeCalledWith(result);
    expect(returnData).toHaveProperty('included');
  });
});
