import { TestingModule } from '@nestjs/testing';
import { ORM_SERVICE } from '@klerick/json-api-nestjs';

import { OrmServiceFactory } from '../../factory';

import { Repository } from 'typeorm';
import { TypeOrmService, TypeormUtilsService } from '../../service';

import {
  dbRandomName,
  getModuleForPgLite,
  getRepository,
  Users,
} from '../../mock-utils';
import { pullUser } from '../../mock-utils/pull-data';

describe('deleteOne', () => {
  const dbName = dbRandomName();
  let typeormService: TypeOrmService<Users>;

  let user: Users;
  let userRepository: Repository<Users>;

  beforeAll(async () => {
    const module: TestingModule = await getModuleForPgLite(
      Users,
      dbName,
      TypeormUtilsService
    );
    ({ userRepository } = getRepository(module));
    user = await pullUser(userRepository);
    typeormService = module.get<TypeOrmService<Users>>(ORM_SERVICE);
  });

  it('Should be ok', async () => {
    await typeormService.deleteOne(`${user.id}`);
    expect(await userRepository.findOneBy({ id: user.id })).toBe(null);
  });
});
