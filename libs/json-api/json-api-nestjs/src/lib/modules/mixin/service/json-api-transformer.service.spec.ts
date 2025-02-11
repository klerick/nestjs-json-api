import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationConfig } from '@nestjs/core';

import { JsonApiTransformerService } from './json-api-transformer.service';
import {
  Addresses,
  Roles,
  Users,
  Notes,
  Comments,
  UserGroups,
  dbRandomName,
  mockDbPgLiteTestModule,
} from '../../../mock-utils/microrom';

import { faker } from '@faker-js/faker';
import { Collection, MikroORM } from '@mikro-orm/core';
import {
  CurrentEntityManager,
  CurrentEntityMetadata,
  CurrentMicroOrmProvider,
  EntityPropsMap,
} from '../../micro-orm/factory';
import {
  CURRENT_ENTITY,
  ENTITY_MAP_PROPS,
  GLOBAL_MODULE_OPTIONS_TOKEN,
} from '../../../constants';
import { DEFAULT_ARRAY_TYPE } from '../../micro-orm/constants';
import { EntityClass } from '../../../types';
import { ZodEntityProps } from '../types';

describe('JsonApiTransformerService - extractAttributes', () => {
  let service: JsonApiTransformerService<Users>;
  const userObject: Users = {} as Users;
  const urlPrefix = 'api';
  const version = '1';
  let mikroORM: MikroORM;
  let dbName: string;
  let mapProps: Map<EntityClass<any>, ZodEntityProps<any>>;
  let mapPropsUser: ZodEntityProps<Users>;
  beforeAll(async () => {
    dbName = dbRandomName(true);
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDbPgLiteTestModule(dbName)],
      providers: [
        CurrentMicroOrmProvider(),
        CurrentEntityManager(),
        CurrentEntityMetadata(),
        JsonApiTransformerService,
        {
          provide: ApplicationConfig,
          useValue: {
            getGlobalPrefix: () => urlPrefix,
            getVersioning: () => ({
              defaultVersion: version,
              type: 0,
            }),
          },
        },
        {
          provide: CURRENT_ENTITY,
          useValue: Users,
        },
        EntityPropsMap([
          Addresses,
          Roles,
          Users,
          Notes,
          Comments,
          UserGroups,
        ] as any),
        {
          provide: GLOBAL_MODULE_OPTIONS_TOKEN,
          useValue: { options: { arrayType: DEFAULT_ARRAY_TYPE } },
        },
      ],
    }).compile();

    service = module.get<JsonApiTransformerService<Users>>(
      JsonApiTransformerService
    );
    mapProps = module.get(ENTITY_MAP_PROPS);
    const mapPropsUserCheck = mapProps.get(Users);
    if (!mapPropsUserCheck) throw new Error('Not found map property for Users');
    mapPropsUser = mapPropsUserCheck;
    mikroORM = module.get(MikroORM);
  });

  afterAll(() => {
    mikroORM.close(true);
  });

  beforeEach(async () => {
    userObject.id = faker.number.int();
    userObject.firstName = faker.person.firstName();
    userObject.lastName = faker.person.lastName();
    userObject.isActive = faker.datatype.boolean();
    userObject.login = faker.internet.userName({
      lastName: userObject.lastName,
      firstName: userObject.firstName,
    });
    userObject.testReal = [faker.number.float({ fractionDigits: 4 })];
    userObject.testArrayNull = null;

    userObject.testDate = faker.date.anytime();
  });

  describe('extractAttributes', () => {
    it('should extract specified fields from an object', () => {
      const fields: (keyof Users)[] = ['firstName', 'lastName', 'login'];
      const result = service.extractAttributes(userObject, fields);

      expect(result).toEqual({
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        login: userObject.login,
      });
    });

    it('should return an empty object if no fields match', () => {
      const fields = ['nonExistentField'] as any;
      const result = service.extractAttributes(userObject, fields);

      expect(result).toEqual({});
    });

    it('should handle an empty fields array', () => {
      const fields: any[] = [];
      const result = service.extractAttributes(userObject, fields);

      expect(result).toEqual({});
    });

    it('should handle an empty input object', () => {
      const inputItem = {};
      const fields: any = ['name', 'description'];
      const result = service.extractAttributes(inputItem, fields);

      expect(result).toEqual({});
    });

    it('should not include fields not present in input object', () => {
      const fields = ['firstName', 'lastName', 'login', 'description'] as any;
      const result = service.extractAttributes(userObject, fields);

      expect(result).toEqual({
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        login: userObject.login,
      });
    });
  });
  describe('transformRelationships', () => {
    beforeEach(() => {
      userObject.addresses = {
        id: faker.number.int(),
        city: faker.location.city(),
        country: faker.location.country(),
        arrayField: [
          faker.string.alphanumeric(5),
          faker.string.alphanumeric(5),
        ],
        state: faker.location.state(),
      } as Addresses;
      userObject.roles = [
        {
          id: faker.number.int(),
          key: faker.string.alphanumeric(5),
          name: faker.word.words(),
        },
      ] as unknown as Collection<Roles>;

      userObject.manager = null as any;
      userObject.notes = [] as any;
    });

    it('should transform relationships without "include" option enabled', () => {
      const query = { include: [] } as any;

      const result = service.transformRelationships(
        userObject,
        mapPropsUser,
        query
      );
      const checkData = mapPropsUser.relations.reduce((acum, i) => {
        acum[i] = {
          links: {
            self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}/relationships/${i}`,
          },
        };
        return acum;
      }, {} as Record<string, unknown>);
      expect(result).toEqual(checkData);
    });

    it('should transform relationships with "include" option enabled', () => {
      const query = { include: ['roles'] } as any;

      const result = service.transformRelationships(
        userObject,
        mapPropsUser,
        query
      );

      const checkData = mapPropsUser.relations.reduce((acum, i) => {
        acum[i] = {
          links: {
            self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}/relationships/${i}`,
          },
        };
        if (i === 'roles') {
          acum[i]['data'] = userObject.roles.map((relName) => ({
            id: relName.id.toString(),
            type: mapProps.get(Roles)?.typeName,
          }));
        }
        return acum;
      }, {} as Record<string, any>);
      expect(result).toEqual(checkData);

      query.include = ['addresses'];
      const result1 = service.transformRelationships(
        userObject,
        mapPropsUser,
        query
      );
      const checkData1 = mapPropsUser.relations.reduce((acum, i) => {
        acum[i] = {
          links: {
            self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}/relationships/${i}`,
          },
        };
        if (i === 'addresses') {
          acum[i]['data'] = {
            id: userObject.addresses.id.toString(),
            type: mapProps.get(Addresses)?.typeName,
          };
        }
        return acum;
      }, {} as Record<string, any>);
      expect(result1).toEqual(checkData1);

      query.include = ['manager', 'notes'];
      const result2 = service.transformRelationships(
        userObject,
        mapPropsUser,
        query
      );
      const checkData2 = mapPropsUser.relations.reduce((acum, i) => {
        acum[i] = {
          links: {
            self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}/relationships/${i}`,
          },
        };
        if (i === 'manager') {
          acum[i]['data'] = null;
        }
        if (i === 'notes') {
          acum[i]['data'] = [];
        }
        return acum;
      }, {} as Record<string, any>);

      expect(result2).toEqual(checkData2);
    });

    it('should return an empty object for empty relationships array', () => {
      const query = { include: [] } as any;

      const result = service.transformRelationships(
        userObject,
        { ...mapPropsUser, relations: [] as any },
        query
      );

      expect(result).toEqual({});
    });
  });
  describe('extractIncluded', () => {
    const roleFake = {} as Roles;
    beforeEach(() => {
      userObject.addresses = {
        id: faker.number.int(),
        city: faker.location.city(),
        country: faker.location.country(),
        arrayField: [
          faker.string.alphanumeric(5),
          faker.string.alphanumeric(5),
        ],
        state: faker.location.state(),
      } as Addresses;
      roleFake.id = faker.number.int();
      roleFake.key = faker.string.alphanumeric(5);
      roleFake.name = faker.word.words();

      userObject.roles = [roleFake] as unknown as Collection<Roles>;

      userObject.manager = null as any;
      userObject.notes = [] as any;
    });

    it('should by include', () => {
      const query = {
        include: ['roles', 'addresses', 'manager', 'notes'],
      } as any;

      const result = service.extractIncluded([userObject], query);
      const rolesInclude = result.find(
        (i) => i.type === mapProps.get(Roles)?.typeName
      );
      const addressesInclude = result.find(
        (i) => i.type === mapProps.get(Addresses)?.typeName
      );
      const managerInclude = result.find(
        (i) => i.type === mapProps.get(Users)?.typeName
      );
      const notesInclude = result.find(
        (i) => i.type === mapProps.get(Notes)?.typeName
      );

      expect(notesInclude).toBe(undefined);
      expect(managerInclude).toBe(undefined);

      const { id: roleId, ...checkRolesAttr } = roleFake;
      expect(rolesInclude).toEqual({
        id: roleId.toString(),
        type: mapProps.get(Roles)?.typeName,
        attributes: checkRolesAttr,
        links: {
          self: `/api/v1/${mapProps.get(Roles)?.typeName}/${roleId}`,
        },
        relationships: {
          users: {
            links: {
              self: `/api/v${version}/${
                mapProps.get(Roles)?.typeName
              }/${roleId}/relationships/users`,
            },
          },
        },
      });
      const { id: addressesId, ...addressesAttr } = userObject.addresses;
      expect(addressesInclude).toEqual({
        id: addressesId.toString(),
        type: mapProps.get(Addresses)?.typeName,
        attributes: addressesAttr,
        links: {
          self: `/api/v1/${mapProps.get(Addresses)?.typeName}/${addressesId}`,
        },
        relationships: {
          user: {
            links: {
              self: `/api/v${version}/${
                mapProps.get(Addresses)?.typeName
              }/${addressesId}/relationships/user`,
            },
          },
        },
      });
    });

    it('should ne include by custom select', () => {
      const userObject = {
        id: faker.number.int(),
        firstName: faker.person.firstName(),
        isActive: faker.datatype.boolean(),
      } as any;
      userObject.addresses = {
        id: faker.number.int(),
        city: faker.location.city(),
        country: faker.location.country(),
        arrayField: [
          faker.string.alphanumeric(5),
          faker.string.alphanumeric(5),
        ],
        state: faker.location.state(),
      } as Addresses;
      userObject.comments = [
        {
          id: faker.number.int(),
          text: faker.lorem.text(),
          kind: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          createdBy: undefined,
        },
      ] as any;

      userObject.manager = {
        id: 1,
        login: faker.internet.userName({
          lastName: faker.person.lastName(),
          firstName: faker.person.firstName(),
        }),
        firstName: undefined,
        testReal: undefined,
        testArrayNull: undefined,
        lastName: undefined,
        isActive: undefined,
        testDate: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        addresses: undefined,
        manager: undefined,
        userGroup: undefined,
      };

      const query = {
        include: ['addresses', 'comments', 'manager'],
        fields: {
          target: ['firstName', 'isActive'],
          comments: ['text'],
          manager: ['login'],
        },
      } as any;

      const result = service.extractIncluded([userObject], query);

      const rolesInclude = result.find(
        (i) => i.type === mapProps.get(Roles)?.typeName
      );
      const addressesInclude = result.find(
        (i) => i.type === mapProps.get(Addresses)?.typeName
      );
      const managerInclude = result.find(
        (i) => i.type === mapProps.get(Users)?.typeName
      );
      const commentsInclude = result.find(
        (i) => i.type === mapProps.get(Comments)?.typeName
      );
      const notesInclude = result.find(
        (i) => i.type === mapProps.get(Notes)?.typeName
      );

      expect(notesInclude).toBe(undefined);
      expect(rolesInclude).toBe(undefined);

      const { id: addressesId, ...addressesAttr } = userObject.addresses;
      expect(addressesInclude).toEqual({
        id: addressesId.toString(),
        type: mapProps.get(Addresses)?.typeName,
        attributes: addressesAttr,
        links: {
          self: `/api/v1/${mapProps.get(Addresses)?.typeName}/${addressesId}`,
        },
        relationships: {
          user: {
            links: {
              self: `/api/v${version}/${
                mapProps.get(Addresses)?.typeName
              }/${addressesId}/relationships/user`,
            },
          },
        },
      });

      const { id: commentsId } = userObject.comments[0];
      expect(commentsInclude).toEqual({
        id: commentsId.toString(),
        type: mapProps.get(Comments)?.typeName,
        attributes: query.fields.comments.reduce((acum: any, field: any) => {
          acum[field] = userObject.comments[0][field];
          return acum;
        }, {}),
        links: {
          self: `/api/v1/${mapProps.get(Comments)?.typeName}/${commentsId}`,
        },
        relationships: {
          createdBy: {
            links: {
              self: `/api/v1/${
                mapProps.get(Comments)?.typeName
              }/${commentsId}/relationships/createdBy`,
            },
          },
        },
      });

      const { id: managerId } = userObject.manager;

      expect(managerInclude).toEqual({
        id: managerId.toString(),
        type: mapProps.get(Users)?.typeName,
        attributes: query.fields.manager.reduce((acum: any, field: any) => {
          acum[field] = userObject.manager[field];
          return acum;
        }, {}),
        links: {
          self: `/api/v1/${mapProps.get(Users)?.typeName}/${managerId}`,
        },
        relationships: {
          addresses: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/addresses`,
            },
          },
          manager: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/manager`,
            },
          },
          roles: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/roles`,
            },
          },
          userGroup: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/userGroup`,
            },
          },
          comments: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/comments`,
            },
          },
          notes: {
            links: {
              self: `/api/v1/${
                mapProps.get(Users)?.typeName
              }/${managerId}/relationships/notes`,
            },
          },
        },
      });
    });
  });
  describe('transformItem', () => {
    it('should transform a single item', () => {
      const query = { include: [] } as any;
      const result = service.transformItem(userObject, mapPropsUser, query);

      const { id, manager, notes, roles, addresses, ...checkAttr } = userObject;

      expect(result).toEqual({
        id: userObject.id.toString(),
        type: mapPropsUser.typeName,
        attributes: checkAttr,
        links: {
          self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}`,
        },
        relationships: {
          addresses: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/addresses`,
            },
          },
          manager: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/manager`,
            },
          },
          roles: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/roles`,
            },
          },
          userGroup: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/userGroup`,
            },
          },
          comments: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/comments`,
            },
          },
          notes: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/notes`,
            },
          },
        },
      });
    });

    it('should be transform with custom select field and include is null', () => {
      const userObject = {
        id: faker.number.int(),
        firstName: faker.person.firstName(),
        isActive: faker.datatype.boolean(),
      } as any;
      userObject.addresses = {
        id: faker.number.int(),
        city: faker.location.city(),
        country: faker.location.country(),
        arrayField: [
          faker.string.alphanumeric(5),
          faker.string.alphanumeric(5),
        ],
        state: faker.location.state(),
      } as Addresses;
      userObject.comments = [] as any;
      userObject.manager = null as any;
      Object.assign(userObject, {
        Comments__comments__id: null,
        Comments__comments__text: null,
        Users__manager__id: null,
        Users__manager__login: null,
      });

      const query = {
        include: ['addresses', 'comments', 'manager'],
        fields: {
          target: ['firstName', 'isActive'],
          comments: ['text'],
          manager: ['login'],
        },
      } as any;

      const result = service.transformItem(userObject, mapPropsUser, query);
      expect(result).toEqual({
        id: userObject.id.toString(),
        type: mapPropsUser.typeName,
        attributes: query.fields.target.reduce((acum: any, i: any) => {
          acum[i] = userObject[i];
          return acum;
        }, {} as any),
        links: {
          self: `/${urlPrefix}/v${version}/${mapPropsUser.typeName}/${userObject.id}`,
        },
        relationships: {
          addresses: {
            data: {
              id: userObject.addresses.id.toString(),
              type: mapProps.get(Addresses)?.typeName,
            },
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/addresses`,
            },
          },
          manager: {
            data: null,
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/manager`,
            },
          },
          comments: {
            data: [],
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/comments`,
            },
          },
          roles: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/roles`,
            },
          },
          userGroup: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/userGroup`,
            },
          },
          notes: {
            links: {
              self: `/api/v1/${mapPropsUser.typeName}/${userObject.id}/relationships/notes`,
            },
          },
        },
      });
    });
  });
});
