import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { getDataSourceToken } from '@nestjs/typeorm';

import {
  createAndPullSchemaBase,
  mockDBTestModule,
  providerEntities,
} from '../../../../mock-utils';
import { CurrentDataSourceProvider } from '../../../../factory';
import { DEFAULT_CONNECTION_NAME } from '../../../../constants';
import { TypeormService } from '../../../../types';
import { getRepository, pullUser, Users } from '../../../../mock-utils';
import {
  TransformDataService,
  TypeormUtilsService,
} from '../../../../mixin/service';
import { Repository } from 'typeorm';
import { CONTROL_OPTIONS_TOKEN, TYPEORM_SERVICE } from '../../../../constants';
import {
  EntityRepositoryFactory,
  TypeormServiceFactory,
} from '../../../../factory';
import { EntityPropsMapService } from '../../../../service';

describe('deleteOne', () => {
  let db: IMemoryDb;
  let typeormService: TypeormService<Users>;
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
        EntityRepositoryFactory(Users),
        TypeormUtilsService,
        TransformDataService,
        TypeormServiceFactory(Users),
        EntityPropsMapService,
      ],
    }).compile();
    ({ userRepository } = getRepository(module));
    user = await pullUser(userRepository);
    typeormService = module.get<TypeormService<Users>>(TYPEORM_SERVICE);
    transformDataService =
      module.get<TransformDataService<Users>>(TransformDataService);
  });

  it('Should be ok', async () => {
    await typeormService.deleteOne(`${user.id}`);
    expect(await userRepository.findOneBy({ id: user.id })).toBe(null);
  });
});
