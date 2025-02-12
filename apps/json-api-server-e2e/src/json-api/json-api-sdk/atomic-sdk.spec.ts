import { INestApplication } from '@nestjs/common';
import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import {
  Addresses,
  CommentKind,
  Comments,
  Roles,
  Users,
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';
import { getUser } from '../utils/data-utils';
import { run, creatSdk } from '../utils/run-application';

let app: INestApplication;

beforeAll(async () => {
  app = await run();
});

afterAll(async () => {
  await app.close();
});

describe('Atomic method:', () => {
  let jsonSdk: JsonSdkPromise;
  let addressArray: Addresses[];
  let rolesArray: Roles[];
  let commentsArray: Comments[];
  let usersId: number[];
  beforeEach(async () => {
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
    usersId = [];
  });

  afterEach(async () => {
    let usersArray: Users[] = [];
    if (usersId.length > 0) {
      usersArray = await jsonSdk.jonApiSdkService.getAll(Users, {
        filter: {
          target: {
            id: { [FilterOperand.in]: usersId.map((i) => `${i}`) },
          },
        },
        include: ['addresses', 'comments', 'roles', 'manager'],
      });

      await Promise.all(
        usersArray.reduce((acum: any[], i) => {
          const tmp = [];
          if (i.comments && i.comments.length > 0) {
            tmp.push(
              jsonSdk.jonApiSdkService.deleteRelationships(i, 'comments')
            );
          }
          if (i.manager) {
            tmp.push(
              jsonSdk.jonApiSdkService.deleteRelationships(i, 'manager')
            );
          }
          if (i.roles && i.roles.length > 0) {
            tmp.push(jsonSdk.jonApiSdkService.deleteRelationships(i, 'roles'));
          }

          acum.push(...tmp);
          return acum;
        }, [])
      );
    }

    for (const item of [
      ...usersArray,
      ...addressArray,
      ...commentsArray,
      ...rolesArray,
    ]) {
      await jsonSdk.jonApiSdkService.deleteOne(item);
    }
  });

  it('Try check intreceptor', async () => {
    const newUser = getUser();
    newUser.addresses = addressArray[0];
    try {
      const result = await jsonSdk.atomicFactory().postOne(newUser).run();
      usersId.push(result[0].id);
    } catch (e) {
      console.log(e);
    }
  });

  it('Should be correct work', async () => {
    const newUser = getUser();
    newUser.addresses = addressArray[0];
    const resultCreate = await jsonSdk.atomicFactory().postOne(newUser).run();

    const patchUser = Object.assign(new Users(), resultCreate[0]);

    newUser.addresses = addressArray[0];

    patchUser.firstName = faker.string.alpha(60);
    patchUser.roles = [rolesArray[0]];

    const patchUser2 = Object.assign(new Users(), resultCreate[0], patchUser);
    const patchUser3 = Object.assign(new Users(), resultCreate[0]);

    patchUser2.comments = [commentsArray[0]];
    patchUser3.comments = [commentsArray[1]];

    const result = await jsonSdk
      .atomicFactory()
      .patchOne(patchUser)
      .patchOne(patchUser2)
      .patchRelationships(patchUser2, 'comments')
      .postRelationships(patchUser3, 'comments')
      .run();
    expect(resultCreate[0].id).toBe(result[0].id);
    expect(resultCreate[0].id).toBe(result[1].id);
    expect(result[1].firstName).toBe(patchUser.firstName);
    expect(result[2]).toEqual([patchUser2.comments[0].id].map((i) => `${i}`));
    expect(result[3].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))).toEqual(
      [patchUser2.comments[0].id, patchUser3.comments[0].id]
        .sort((a, b) => a - b)
        .map((i) => `${i}`)
    );

    const resultUser = await jsonSdk.jonApiSdkService.getAll(Users, {
      filter: {
        target: {
          id: {
            [FilterOperand.eq]: `${resultCreate[0].id}`,
          },
        },
      },
      include: ['addresses', 'comments', 'roles'],
    });
    expect(
      resultUser[0].comments.map((i) => i.id).sort((a, b) => a - b)
    ).toEqual(
      [patchUser2.comments[0].id, patchUser3.comments[0].id].sort(
        (a, b) => a - b
      )
    );
    expect(resultUser[0].roles.map((i) => i.id)).toEqual(
      patchUser.roles.map((i) => i.id)
    );
    expect(resultUser[0].addresses.id).toEqual(newUser.addresses.id);
    usersId.push(resultCreate[0].id);
  });

  it('Should be correct work with tmp Id', async () => {
    const address = new Addresses();

    address.city = faker.string.alpha(50);
    address.state = faker.string.alpha(50);
    address.country = faker.string.alpha(50);
    address.id = 10000;

    const manager = getUser();
    manager.id = 10001;
    manager.addresses = address;

    const roles = new Roles();
    roles.id = 10002;
    roles.name = faker.string.alpha(50);
    roles.key = faker.string.alpha(50);

    const user = getUser();
    user.addresses = address;
    user.manager = manager;
    user.roles = [roles];

    const [addressPost, managerPost, rolesPost, userPost] = await jsonSdk
      .atomicFactory()
      .postOne(address)
      .postOne(manager)
      .postOne(roles)
      .postOne(user)
      .run();

    const selectManager = await jsonSdk.jonApiSdkService.getOne(
      Users,
      managerPost.id,
      { include: ['addresses'] }
    );
    const selectUser = await jsonSdk.jonApiSdkService.getOne(
      Users,
      userPost.id,
      {
        include: ['addresses', 'manager', 'roles'],
      }
    );

    expect(selectManager.addresses.id).toBe(addressPost.id);
    expect(selectUser.manager.id).toBe(managerPost.id);
    expect(selectUser.roles).toEqual([rolesPost]);
    expect(selectUser.addresses).toEqual(addressPost);

    addressArray.push(addressPost);
    rolesArray.push(rolesPost);
    usersId.push(managerPost.id);
    usersId.push(userPost.id);
  });
});
