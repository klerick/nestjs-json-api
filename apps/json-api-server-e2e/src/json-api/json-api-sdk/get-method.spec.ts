import { INestApplication } from '@nestjs/common';
import { Addresses, CommentKind, Comments, Roles, Users } from 'database';
import { faker } from '@faker-js/faker';

import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { getUser } from '../utils/data-utils';
import { creatSdk, run } from '../utils/run-application';

let app: INestApplication;

beforeAll(async () => {
  app = await run();
});

afterAll(async () => {
  await app.close();
});

describe('GET method:', () => {
  let jsonSdk: JsonSdkPromise;
  let usersArray: Users[];
  let addressArray: Addresses[];
  let rolesArray: Roles[];
  let commentsArray: Comments[];

  beforeAll(async () => {
    jsonSdk = creatSdk();

    const addressesPromise = Array.from(new Array(2)).map(() => {
      const address = new Addresses();
      address.city = faker.string.alpha(50);
      address.state = faker.string.alpha(50);
      address.country = faker.string.alpha(50);
      return jsonSdk.jonApiSdkService.postOne(address);
    });
    addressArray = await Promise.all(addressesPromise);

    const rolesPromise = Array.from(new Array(6)).map(() => {
      const roles = new Roles();
      roles.name = faker.string.alpha(50);
      roles.key = faker.string.alpha(50);
      return jsonSdk.jonApiSdkService.postOne(roles);
    });

    rolesArray = await Promise.all(rolesPromise);
    const commentsPromise = Array.from(new Array(5)).map(() => {
      const comments = new Comments();
      comments.text = faker.string.alpha(50);
      comments.kind = CommentKind.Comment;
      return jsonSdk.jonApiSdkService.postOne(comments);
    });

    commentsArray = await Promise.all(commentsPromise);
    const usersPromise = Array.from(new Array(5)).map((i, index) => {
      const addressIndex = index % 2 === 0 ? 0 : 1;
      const user = getUser();
      user.isActive = !!addressIndex;
      user.addresses = addressArray[addressIndex];
      return jsonSdk.jonApiSdkService.postOne(user);
    });
    usersArray = await Promise.all(usersPromise);
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

    await jsonSdk.jonApiSdkService.patchOne(usersArray[0]);
    await jsonSdk.jonApiSdkService.patchOne(usersArray[1]);
  });

  afterAll(async () => {
    await Promise.all(
      usersArray.map((i) => {
        const tmp = [];
        if (i.comments) {
          tmp.push(jsonSdk.jonApiSdkService.deleteRelationships(i, 'comments'));
        }
        if (i.manager) {
          tmp.push(jsonSdk.jonApiSdkService.deleteRelationships(i, 'manager'));
        }
        if (i.roles) {
          tmp.push(jsonSdk.jonApiSdkService.deleteRelationships(i, 'roles'));
        }
        return Promise.all(tmp);
      })
    );
    await Promise.all(addressArray);
    await Promise.all(
      [...usersArray, ...commentsArray, ...rolesArray].map((i) =>
        jsonSdk.jonApiSdkService.deleteOne(i)
      )
    );
  });

  describe('Check filter', () => {
    it('Should be get all entities', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users);
      expect(users).toBeDefined();
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0);
    });

    it('Should be get entities with filter', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users, {
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
      });
      expect(users).toBeDefined();
      expect(users.length).toBe(2);
      users.forEach((user) => {
        expect(user.isActive).toBe(true);
      });

      const users2 = await jsonSdk.jonApiSdkService.getAll(Users, {
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
    });

    it('Should be get entities with filter by relation target', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users, {
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

      const users1 = await jsonSdk.jonApiSdkService.getAll(Users, {
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

    it('Should be get entities with filter by relation', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users, {
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

  describe('Check pagination', () => {
    it('Check limit', async () => {
      const users = await jsonSdk.jonApiSdkService.getList(Users, {
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
    it('Check limit second page', async () => {
      const users = await jsonSdk.jonApiSdkService.getList(Users, {
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

  describe('Check select', () => {
    it('Check target field', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users, {
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
    it('Check relation field', async () => {
      const users = await jsonSdk.jonApiSdkService.getAll(Users, {
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

  describe('Get relation', () => {
    it('Get relation by id result string', async () => {
      const userItem = usersArray[0];

      const result = await jsonSdk.jonApiSdkService.getRelationships(
        userItem,
        'addresses'
      );

      const resultGetOne = await jsonSdk.jonApiSdkService.getOne(
        Users,
        userItem.id,
        { include: ['addresses'] }
      );
      expect(result).toBe(`${resultGetOne.addresses.id}`);
    });

    it('Get relation by id result string array', async () => {
      const userItem = usersArray.filter((i) => i.roles)[0];

      const result = await jsonSdk.jonApiSdkService.getRelationships(
        userItem,
        'roles'
      );

      const resultGetOne = await jsonSdk.jonApiSdkService.getOne(
        Users,
        userItem.id,
        { include: ['roles'] }
      );
      expect(result).toEqual(resultGetOne.roles.map((i) => `${i.id}`));
    });
  });
});
