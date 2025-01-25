import { Test, TestingModule } from '@nestjs/testing';
import { IMemoryDb } from 'pg-mem';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Addresses,
  Comments,
  getRepository,
  mockDBTestModule,
  Notes,
  providerEntities,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../../mock-utils/typeorm';
import { CurrentDataSourceProvider, CurrentEntityRepository } from '../factory';
import { DEFAULT_CONNECTION_NAME } from '../../../constants';
import { TransformDataService } from './transform-data.service';
import { ApplicationConfig } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { EntityPropsMapService } from '../service';
import { createAndPullSchemaBase } from '../../../mock-utils';

describe('TransformDataService', () => {
  let db: IMemoryDb;
  let transformDataService: TransformDataService<Users>;
  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;
  let applicationConfig: ApplicationConfig;
  let entityPropsMapService: EntityPropsMapService;
  let usersData: Users;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        //   TransformDataService,
        //   EntityPropsMapService,
      ],
    }).compile();

    // ({
    //   userRepository,
    //   addressesRepository,
    //   notesRepository,
    //   commentsRepository,
    //   rolesRepository,
    //   userGroupRepository,
    // } = getRepository(module));
    // await pullAllData(
    //   userRepository,
    //   addressesRepository,
    //   notesRepository,
    //   commentsRepository,
    //   rolesRepository,
    //   userGroupRepository
    // );

    // transformDataService =
    //   module.get<TransformDataService<Users>>(TransformDataService);
    // entityPropsMapService = module.get<EntityPropsMapService>(
    //   EntityPropsMapService
    // );
    //
    // const data = await userRepository.findOne({
    //   where: {
    //     id: 1,
    //   },
    //   relations: {
    //     userGroup: true,
    //     manager: true,
    //     roles: true,
    //     addresses: true,
    //     comments: true,
    //     notes: true,
    //   },
    // });
    // if (!data) {
    //   throw new Error('Not found user');
    // }
    // usersData = data;
    // applicationConfig = module.get<ApplicationConfig>(ApplicationConfig);
  });

  beforeEach(() => {
    // transformDataService = new TransformDataService();
    // Object.defineProperty(transformDataService, 'applicationConfig', {
    //   value: applicationConfig,
    // });
    // Object.defineProperty(transformDataService, 'entityPropsMapService', {
    //   value: entityPropsMapService,
    // });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('Test', () => {});

  // it('Url path', () => {
  //   const prefix = 'api';
  //   applicationConfig.setGlobalPrefix(prefix);
  //
  //   expect(transformDataService.urlPath).toEqual(['', prefix]);
  // });
  // it('Url path with version', () => {
  //   const prefix = 'api';
  //   const version = '1';
  //
  //   applicationConfig.setGlobalPrefix(prefix);
  //
  //   jest
  //     .spyOn(applicationConfig, 'getVersioning')
  //     .mockImplementationOnce(() => ({
  //       type: VersioningType.URI,
  //       defaultVersion: version,
  //     }));
  //
  //   expect(transformDataService.urlPath).toEqual(['', prefix, 'v1']);
  // });
  //
  // it('check type, id and links', () => {
  //   const result = transformDataService.transformData(usersData);
  //   expect(result).toHaveProperty('data');
  //   const { data } = result;
  //   expect(data.type).toBe('users');
  //   expect(data.id).toBe(usersData.id.toString());
  //   expect(data.links.self).toBe(
  //     [...transformDataService.urlPath, 'users', usersData.id.toString()].join(
  //       '/'
  //     )
  //   );
  // });
  //
  // it('check attributes', async () => {
  //   const result = transformDataService.transformData(usersData);
  //   const {
  //     id,
  //     addresses,
  //     comments,
  //     manager,
  //     roles,
  //     notes,
  //     userGroup,
  //     ...other
  //   } = usersData;
  //   expect(result.data.attributes).toEqual(other);
  //   const result1 = transformDataService.transformData([]);
  //   expect(result1.data).toEqual([]);
  //
  //   const data = await userRepository.findOne({
  //     select: {
  //       id: true,
  //       login: true,
  //       isActive: true,
  //       testDate: true,
  //     },
  //     where: {
  //       id: 1,
  //     },
  //   });
  //   if (!data) {
  //     throw new Error('Not found user');
  //   }
  //   const result2 = transformDataService.transformData(data);
  //   const { id: id2, ...other2 } = data;
  //
  //   expect(result2.data.attributes).toEqual(other2);
  // });
  //
  // it('check relationships', async () => {
  //   const {
  //     data: { relationships },
  //   } = transformDataService.transformData(usersData);
  //   expect(relationships?.addresses?.data).toEqual({
  //     type: 'addresses',
  //     id: usersData.addresses.id.toString(),
  //   });
  //   expect(relationships?.addresses?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/addresses`
  //   );
  //   expect(relationships?.manager?.data).toEqual({
  //     type: 'users',
  //     id: usersData.manager.id.toString(),
  //   });
  //   expect(relationships?.manager?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/manager`
  //   );
  //   expect(relationships?.roles?.data).toEqual(
  //     usersData.roles.map((i) => ({
  //       type: 'roles',
  //       id: i.id.toString(),
  //     }))
  //   );
  //   expect(relationships?.roles?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/roles`
  //   );
  //   expect(relationships?.comments?.data).toEqual(
  //     usersData.comments.map((i) => ({
  //       type: 'comments',
  //       id: i.id.toString(),
  //     }))
  //   );
  //   expect(relationships?.comments?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/comments`
  //   );
  //   expect(relationships?.notes?.data).toEqual(
  //     usersData.notes.map((i) => ({
  //       type: 'notes',
  //       id: i.id.toString(),
  //     }))
  //   );
  //   expect(relationships?.notes?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/notes`
  //   );
  //   expect(relationships?.userGroup?.data).toEqual({
  //     type: 'user-groups',
  //     id: usersData.userGroup.id.toString(),
  //   });
  //   expect(relationships?.userGroup?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/userGroup`
  //   );
  // });
  //
  // it('check relationships again', async () => {
  //   const data = await userRepository.findOne({
  //     where: {
  //       id: 1,
  //     },
  //     relations: {
  //       userGroup: true,
  //       roles: true,
  //     },
  //   });
  //   if (!data) {
  //     throw new Error('Not found user');
  //   }
  //
  //   const {
  //     data: { relationships },
  //   } = transformDataService.transformData(data);
  //
  //   expect(relationships?.addresses).not.toHaveProperty('data');
  //   expect(relationships?.addresses?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/addresses`
  //   );
  //   expect(relationships?.manager).not.toHaveProperty('data');
  //   expect(relationships?.manager?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/manager`
  //   );
  //   expect(relationships?.roles?.data).toEqual(
  //     usersData.roles.map((i) => ({
  //       type: 'roles',
  //       id: i.id.toString(),
  //     }))
  //   );
  //   expect(relationships?.roles?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/roles`
  //   );
  //   expect(relationships?.comments).not.toHaveProperty('data');
  //   expect(relationships?.comments?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/comments`
  //   );
  //   expect(relationships?.notes).not.toHaveProperty('data');
  //   expect(relationships?.notes?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/notes`
  //   );
  //   expect(relationships?.userGroup?.data).toEqual({
  //     type: 'user-groups',
  //     id: usersData.userGroup.id.toString(),
  //   });
  //   expect(relationships?.userGroup?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/userGroup`
  //   );
  //   data.userGroup = null as any;
  //   data.roles = [];
  //   const {
  //     data: { relationships: relationships2 },
  //   } = transformDataService.transformData(data);
  //
  //   expect(relationships2?.addresses).not.toHaveProperty('data');
  //   expect(relationships2?.addresses?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/addresses`
  //   );
  //   expect(relationships2?.manager).not.toHaveProperty('data');
  //   expect(relationships2?.manager?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/manager`
  //   );
  //
  //   expect(relationships2?.roles?.data).toEqual([]);
  //   expect(relationships2?.roles?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/roles`
  //   );
  //   expect(relationships2?.comments).not.toHaveProperty('data');
  //   expect(relationships2?.comments?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/comments`
  //   );
  //   expect(relationships2?.notes).not.toHaveProperty('data');
  //   expect(relationships2?.notes?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/notes`
  //   );
  //   expect(relationships2?.userGroup?.data).toEqual(null);
  //   expect(relationships2?.userGroup?.links.self).toBe(
  //     `${transformDataService.urlPath.join('/')}/users/${
  //       usersData.id
  //     }/relationships/userGroup`
  //   );
  // });
  //
  // it('check include', async () => {
  //   const data = await userRepository.findOne({
  //     where: {
  //       id: 1,
  //     },
  //     relations: {
  //       userGroup: true,
  //       roles: true,
  //     },
  //   });
  //   if (!data) {
  //     throw new Error('Not found user');
  //   }
  //
  //   const { included } = transformDataService.transformData(data);
  //   expect(included).not.toBe(undefined);
  // });
});
