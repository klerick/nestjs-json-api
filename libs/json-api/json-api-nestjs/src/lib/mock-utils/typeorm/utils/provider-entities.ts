import { DataSource, Repository } from 'typeorm';
import { Provider } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import {
  Addresses,
  Comments,
  Entities,
  Notes,
  Pods,
  Roles,
  UserGroups,
} from '../entities';
import { Users } from '../entities';
import { DEFAULT_CONNECTION_NAME } from '../../../constants';
import { TestingModule } from '@nestjs/testing';

export function providerEntities(
  dataSourceToken: ReturnType<typeof getDataSourceToken>
): Provider[] {
  return Entities.map((entitiy) => {
    return {
      provide: getRepositoryToken(entitiy, DEFAULT_CONNECTION_NAME),
      useFactory(dataSource: DataSource) {
        return dataSource.getRepository(entitiy);
      },
      inject: [getDataSourceToken()],
    };
  });
}

export function getRepository(module: TestingModule) {
  const userRepository = module.get<Repository<Users>>(
    getRepositoryToken(Users, DEFAULT_CONNECTION_NAME)
  );

  const addressesRepository = module.get<Repository<Addresses>>(
    getRepositoryToken(Addresses, DEFAULT_CONNECTION_NAME)
  );

  const notesRepository = module.get<Repository<Notes>>(
    getRepositoryToken(Notes, DEFAULT_CONNECTION_NAME)
  );

  const commentsRepository = module.get<Repository<Comments>>(
    getRepositoryToken(Comments, DEFAULT_CONNECTION_NAME)
  );
  const rolesRepository = module.get<Repository<Roles>>(
    getRepositoryToken(Roles, DEFAULT_CONNECTION_NAME)
  );

  const userGroupRepository = module.get<Repository<UserGroups>>(
    getRepositoryToken(UserGroups, DEFAULT_CONNECTION_NAME)
  );

  const podsRepository = module.get<Repository<Pods>>(
    getRepositoryToken(Pods, DEFAULT_CONNECTION_NAME)
  );

  return {
    userRepository,
    addressesRepository,
    notesRepository,
    commentsRepository,
    rolesRepository,
    userGroupRepository,
    podsRepository,
  };
}
