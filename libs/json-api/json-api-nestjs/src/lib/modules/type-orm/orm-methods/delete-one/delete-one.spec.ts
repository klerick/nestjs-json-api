import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { getDataSourceToken } from '@nestjs/typeorm';

import {
  mockDBTestModule,
  providerEntities,
} from '../../../../mock-utils/typeorm';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  OrmServiceFactory,
} from '../../factory';
import { DEFAULT_CONNECTION_NAME } from '../../../../constants';

import { getRepository, pullUser, Users } from '../../../../mock-utils/typeorm';

import { Repository } from 'typeorm';
import { CONTROL_OPTIONS_TOKEN, ORM_SERVICE } from '../../../../constants';

import {
  EntityPropsMapService,
  TypeOrmService,
  TransformDataService,
  TypeormUtilsService,
} from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';

describe('deleteOne', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: TransformDataService<Users>;

  let user: Users;
  let userRepository: Repository<Users>;

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
    ({ userRepository } = getRepository(module));
    user = await pullUser(userRepository);
    typeormService = module.get<TypeOrmService<Users>>(ORM_SERVICE);
    transformDataService =
      module.get<TransformDataService<Users>>(TransformDataService);
  });

  it('Should be ok', async () => {
    await typeormService.deleteOne(`${user.id}`);
    expect(await userRepository.findOneBy({ id: user.id })).toBe(null);
  });
});
