import {
  Addresses,
  CommentKind,
  Comments,
  Roles,
  Users,
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';

import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { getUser } from '../utils/data-utils';
import { creatSdk } from '../utils/run-application';
import { AxiosError } from 'axios';

/**
 * JSON API: GET Operations using entity() with plain structures
 */
describe('JSON API: GET Operations with entity() and plain structures', () => {
  let jsonSdk: JsonSdkPromise;
  let usersArray: Users[];
  let addressArray: Addresses[];
  let rolesArray: Roles[];
  let commentsArray: Comments[];

  beforeAll(async () => {
    jsonSdk = creatSdk();

    const addressesPromise = Array.from(new Array(5)).map(() => {
      const address = new Addresses();
      address.city = faker.string.alpha(50);
      address.state = faker.string.alpha(50);
      address.country = faker.string.alpha(50);
      return jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();
    });
    const addressPlainArray = await Promise.all(addressesPromise);
    // Convert to raw instances for relationships (need proper constructor.name)
    addressArray = addressPlainArray.map(a => jsonSdk.jsonApiSdkService.entity('Addresses', a, true));

    const rolesPromise = Array.from(new Array(6)).map(() => {
      const roles = new Roles();
      roles.name = faker.string.alpha(50);
      roles.key = faker.string.alpha(50);
      return jsonSdk.jsonApiSdkService.entity('Roles', Object.assign({}, roles)).postOne();
    });

    const rolesPlainArray = await Promise.all(rolesPromise);
    rolesArray = rolesPlainArray.map(r => jsonSdk.jsonApiSdkService.entity('Roles', r, true));

    const commentsPromise = Array.from(new Array(5)).map(() => {
      const comments = new Comments();
      comments.text = faker.string.alpha(50);
      comments.kind = CommentKind.Comment;
      return jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, comments)).postOne();
    });

    const commentsPlainArray = await Promise.all(commentsPromise);
    commentsArray = commentsPlainArray.map(c => jsonSdk.jsonApiSdkService.entity('Comments', c, true));

    const usersPromise = Array.from(new Array(5)).map((i, index) => {
      const user = getUser();
      user.isActive = index % 2 !== 0;
      user.addresses = addressArray[index];
      return jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, user)).postOne();
    });
    const usersPlainArray = await Promise.all(usersPromise);
    usersArray = usersPlainArray.map(u => jsonSdk.jsonApiSdkService.entity('Users', u, true));

    // Remove addresses from response (postOne now returns relationships)
    // to avoid sending it again in patchOne - we only want to update manager, roles, comments
    delete (usersArray[0] as any).addresses;
    delete (usersArray[1] as any).addresses;

    usersArray[0].manager = usersArray[2];
    usersArray[0].roles = [rolesArray[0], rolesArray[1], rolesArray[2]];
    usersArray[0].comments = [
      commentsArray[0],
      commentsArray[1],
      commentsArray[2],
    ];
    usersArray[1].manager = usersArray[3];
    usersArray[1].roles = [rolesArray[3], rolesArray[4]];
    usersArray[1].comments = [commentsArray[3], commentsArray[4]];

    await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, usersArray[0])).patchOne();
    await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, usersArray[1])).patchOne();
  });

  afterAll(async () => {
    await Promise.all(
      usersArray.map((i) => {
        const tmp = [];
        if (i.comments) {
          tmp.push(jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, i)).deleteRelationships('comments'));
        }
        if (i.manager) {
          tmp.push(jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, i)).deleteRelationships('manager'));
        }
        if (i.roles) {
          tmp.push(jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, i)).deleteRelationships('roles'));
        }
        return Promise.all(tmp);
      })
    );

    await Promise.all(
      usersArray.map((i) => jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, i)).deleteOne())
    );
    await Promise.all(
      commentsArray.map((i) => jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, i)).deleteOne())
    );
    await Promise.all(
      rolesArray.map((i) => jsonSdk.jsonApiSdkService.entity('Roles', Object.assign({}, i)).deleteOne())
    );
    await Promise.all(
      addressArray.map((i) => jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, i)).deleteOne())
    );
  });

  describe('Filtering Resources', () => {
    it('should fetch all users without filters and return plain objects', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users');
      expect(users).toBeDefined();
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0);
      // When using string type name, result should be plain object
      expect(users[0].constructor.name).toBe('Object');
    });

    it('should filter users by target attributes using eq, ne, in, and like operators', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            isActive: {
              [FilterOperand.eq]: 'true',
            },
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
      }).catch((e: AxiosError) => {
        console.log(e);
        throw e;
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(2);
      users.forEach((user) => {
        expect(user.isActive).toBe(true);
      });

      const users2 = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            isActive: {
              [FilterOperand.ne]: 'true',
            },
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
      });
      expect(users2).toBeDefined();
      expect(users2.length).toBe(3);
      users2.forEach((user) => {
        expect(user.isActive).toBe(false);
      });

      const resultFindLike = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            login: { [FilterOperand.like]: users2.at(0)?.login.slice(5, -5) },
          },
        },
      });
      expect(resultFindLike.length).toBe(1);
      expect(resultFindLike.at(0)?.id).toBe(users2.at(0)?.id);
    });

    it('should filter users by relationship existence (null/not null check)', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            manager: {
              [FilterOperand.eq]: null,
            },
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(3);
      users.forEach((user) => {
        expect(user.manager).toBeUndefined();
      });

      const users1 = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            manager: {
              [FilterOperand.ne]: null,
            },
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
      });
      expect(users1).toBeDefined();
      expect(users1.length).toBe(2);
      users1.forEach((user) => {
        expect(user.manager).toBeUndefined();
      });
    });

    it('should filter users by related resource attributes (roles.name)', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
          roles: {
            name: {
              [FilterOperand.eq]: rolesArray[0].name,
            },
          },
        },
        include: ['roles'],
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      users.forEach((user) => {
        expect(user.roles).toBeDefined();
      });
    });
  });

  describe('Pagination and Sorting', () => {
    it('should return first page with page size limit', async () => {
      const users = await jsonSdk.jsonApiSdkService.getList<Users>('Users', {
        filter: {
          target: {
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
        page: {
          number: 1,
          size: 1,
        },
        sort: {
          target: {
            id: 'ASC',
          },
        },
      });

      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(usersArray.sort((a, b) => a.id - b.id)[0].id);
    });
    it('should return second page when page number is 2', async () => {
      const users = await jsonSdk.jsonApiSdkService.getList<Users>('Users', {
        filter: {
          target: {
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
        page: {
          number: 2,
          size: 1,
        },
        sort: {
          target: {
            id: 'ASC',
          },
        },
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      expect(users[0].id).toBe(usersArray.sort((a, b) => a.id - b.id)[1].id);
    });
  });

  describe('Sparse Fieldsets (Field Selection)', () => {
    it('should return only specified target fields (id, isActive)', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            id: {
              [FilterOperand.in]: usersArray.map((i) => `${i.id}`),
            },
          },
        },
        fields: {
          target: ['isActive', 'id'],
        },
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(5);
      users.forEach((user) => {
        expect(user.isActive).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.lastName).toBeUndefined();
        expect(user.firstName).toBeUndefined();
      });
    });
    it('should return specified fields for both target and related resources', async () => {
      const users = await jsonSdk.jsonApiSdkService.getAll<Users>('Users', {
        filter: {
          target: {
            id: {
              [FilterOperand.in]: usersArray
                .sort((a, b) => a.id - b.id)
                .map((i) => `${i.id}`),
            },
          },
        },
        fields: {
          target: ['isActive', 'id'],
          roles: ['key'],
        },
        include: ['roles'],
      });

      expect(users).toBeDefined();
      expect(users.length).toBe(5);

      users.forEach((user) => {
        expect(user.isActive).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.lastName).toBeUndefined();
        expect(user.firstName).toBeUndefined();
        expect(user.roles).toBeDefined();
        expect(user.roles).toBeInstanceOf(Array);

        if (
          user.roles.length > 0 &&
          (user.id === usersArray[0].id || user.id === usersArray[1].id)
        ) {
          expect(user.roles[0].key).toBeDefined();
          expect(user.roles[0].name).toBeUndefined();
        }
      });
    });
  });

  describe('Fetching Relationship Data', () => {
    it('should return relationship identifier for to-one relationship (addresses)', async () => {
      const userItem = usersArray[0];

      const result = await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userItem)).getRelationships('addresses');

      const resultGetOne = await jsonSdk.jsonApiSdkService.getOne<Users>(
        'Users',
        userItem.id,
        { include: ['addresses'] }
      );

      expect(result).toBe(`${resultGetOne.addresses.id}`);
      // getOne with string type name returns plain object
      expect(resultGetOne.constructor.name).toBe('Object');
      // Included relation should also be plain object
      expect(resultGetOne.addresses.constructor.name).toBe('Object');
    });

    it('should return relationship identifiers for to-many relationship (roles)', async () => {
      const userItem = usersArray.filter((i) => i.roles)[0];

      const result = await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userItem)).getRelationships('roles');

      const resultGetOne = await jsonSdk.jsonApiSdkService.getOne<Users>(
        'Users',
        userItem.id,
        { include: ['roles'] }
      );
      expect(result).toEqual(resultGetOne.roles.map((i) => `${i.id}`));
    });
  });
});
