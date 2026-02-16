/**
 * JSON API: Atomic Operations - Batch Requests
 *
 * This test suite demonstrates how to use the JSON API SDK's atomic operations
 * to execute multiple operations in a single request. Atomic operations ensure
 * that all operations succeed or fail together.
 *
 * Examples include:
 * - Executing multiple POST, PATCH, and relationship operations in one request
 * - Using temporary IDs (lid) to reference resources created within the same request
 * - Updating relationships (replacing and appending) atomically
 * - Maintaining referential integrity across multiple operations
 * - Handling complex resource graphs with dependencies
 */

import { FilterOperand, JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import {
  Addresses,
  CommentKind,
  Comments,
  Roles,
  Users,
  BookList
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';
import { getUser } from '../utils/data-utils';
import { creatSdk } from '../utils/run-application';

describe('Atomic Operations (Batch Requests)', () => {
  let jsonSdk: JsonSdkPromise;
  let addressArray: Addresses[];
  let rolesArray: Roles[];
  let commentsArray: Comments[];
  let bookList: BookList[];
  let usersId: number[];
  beforeEach(async () => {
    jsonSdk = creatSdk();

    const addressesPromise = Array.from(new Array(2)).map(() => {
      const address = new Addresses();
      address.city = faker.string.alpha(50);
      address.state = faker.string.alpha(50);
      address.country = faker.string.alpha(50);
      return jsonSdk.jsonApiSdkService.postOne(address);
    });
    addressArray = await Promise.all(addressesPromise);
    const rolesPromise = Array.from(new Array(6)).map(() => {
      const roles = new Roles();
      roles.name = faker.string.alpha(50);
      roles.key = faker.string.alpha(50);
      return jsonSdk.jsonApiSdkService.postOne(roles);
    });

    rolesArray = await Promise.all(rolesPromise);
    const commentsPromise = Array.from(new Array(5)).map(() => {
      const comments = new Comments();
      comments.text = faker.string.alpha(50);
      comments.kind = CommentKind.Comment;
      return jsonSdk.jsonApiSdkService.postOne(comments);
    });

    commentsArray = await Promise.all(commentsPromise);
    usersId = [];
    bookList =[];
  });

  afterEach(async () => {
    let usersArray: Users[] = [];
    if (usersId.length > 0) {
      usersArray = await jsonSdk.jsonApiSdkService.getAll(Users, {
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
              jsonSdk.jsonApiSdkService.deleteRelationships(i, 'comments')
            );
          }
          if (i.manager) {
            tmp.push(
              jsonSdk.jsonApiSdkService.deleteRelationships(i, 'manager')
            );
          }
          if (i.roles && i.roles.length > 0) {
            tmp.push(jsonSdk.jsonApiSdkService.deleteRelationships(i, 'roles'));
          }

          acum.push(...tmp);
          return acum;
        }, [])
      );
    }

    for (const item of [
      ...bookList,
      ...usersArray,
      ...addressArray,
      ...commentsArray,
      ...rolesArray,
    ]) {
      await jsonSdk.jsonApiSdkService.deleteOne(item);
    }
  });

  it('should execute a simple atomic operation with a single POST request', async () => {
    const newUser = getUser();
    newUser.addresses = addressArray[0];
    try {
      const result = await jsonSdk.atomicFactory().postOne(newUser).run();
      usersId.push(result[0].id);
    } catch (e) {
      console.log(e);
    }
  });

  it('should execute multiple operations atomically: POST, PATCH, patchRelationships, and postRelationships', async () => {
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

    const resultUser = await jsonSdk.jsonApiSdkService.getAll(Users, {
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

  it('should create multiple related resources using temporary IDs (lid) to reference resources within the same atomic request', async () => {
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

    const userAddress = new Addresses();

    userAddress.city = faker.string.alpha(50);
    userAddress.state = faker.string.alpha(50);
    userAddress.country = faker.string.alpha(50);
    userAddress.id = 10003;

    const user = getUser();
    user.addresses = userAddress;
    user.manager = manager;
    user.roles = [roles];

    const [addressPost, userAddressPost, managerPost, rolesPost, userPost] = await jsonSdk
      .atomicFactory()
      .postOne(address)
      .postOne(userAddress)
      .postOne(manager)
      .postOne(roles)
      .postOne(user)
      .run();

    const selectManager = await jsonSdk.jsonApiSdkService.getOne(
      Users,
      managerPost.id,
      { include: ['addresses'] }
    );
    const selectUser = await jsonSdk.jsonApiSdkService.getOne(
      Users,
      userPost.id,
      {
        include: ['addresses', 'manager', 'roles'],
      }
    );

    expect(selectManager.addresses.id).toBe(addressPost.id);
    expect(selectUser.manager.id).toBe(managerPost.id);
    expect(selectUser.roles).toEqual([rolesPost]);
    expect(selectUser.addresses.id).toEqual(userAddressPost.id);

    addressArray.push(addressPost, userAddressPost);
    rolesArray.push(rolesPost);
    usersId.push(managerPost.id);
    usersId.push(userPost.id);
  });

  it('should handle lid (tmpId) correctly when first operation has temporary ID', async () => {

    const book1 = new BookList();
    book1.id = '019c4d00-aaaa-0000-0000-000000000001'; // Temporary UUID (lid/tmpId)
    book1.text = faker.string.alpha(50);

    const book2 = new BookList();
    book2.id = '019c4d00-bbbb-0000-0000-000000000002'; // Temporary UUID (lid/tmpId)
    book2.text = faker.string.alpha(50);

    const user = getUser();
    user.addresses = addressArray[0];
    user.books = [book1, book2]; // Reference books created in same atomic operation

    const [createdBook1, createdBook2, createdUser] = await jsonSdk
      .atomicFactory()
      .postOne(book1)  // First operation - this exposed the bug!
      .postOne(book2)
      .postOne(user)
      .run();


    expect(createdBook1).toBeDefined();
    expect(createdBook1.id).toBeDefined();
    expect(createdBook1.text).toBe(book1.text);

    expect(createdBook1.id).toBe(book1.id);
    expect(createdBook2.id).toBe(book2.id);

    expect(createdBook2).toBeDefined();
    expect(createdBook2.id).toBeDefined();
    expect(createdBook2.text).toBe(book2.text);

    const fetchedUser = await jsonSdk.jsonApiSdkService.getOne(
      Users,
      createdUser.id,
      { include: ['books'] }
    );

    bookList.push(
      ...fetchedUser.books.map((b) =>
        jsonSdk.jsonApiSdkService.entity('OverrideBookList', b, true)
      )
    );

    expect(fetchedUser.books).toHaveLength(2);
    const bookIds = fetchedUser.books.map(b => b.id).sort();
    expect(bookIds).toEqual([createdBook1.id, createdBook2.id].sort());

    usersId.push(createdUser.id);
  });

  it('should create users with meta.prefix in atomic operation and apply prefix to firstName', async () => {
    // Create separate addresses for each user in atomic operation with lid
    const address1 = new Addresses();
    address1.id = 999; // temporary lid
    address1.city = faker.string.alpha(50);
    address1.state = faker.string.alpha(50);
    address1.country = faker.string.alpha(50);

    const address2 = new Addresses();
    address2.id = 1000; // temporary lid
    address2.city = faker.string.alpha(50);
    address2.state = faker.string.alpha(50);
    address2.country = faker.string.alpha(50);

    const user1 = getUser();
    const user2 = getUser();
    const originalFirstName1 = faker.person.firstName();
    const originalFirstName2 = faker.person.firstName();
    const prefix = 'ATOMIC_';

    user1.firstName = originalFirstName1;
    user1.addresses = address1;

    user2.firstName = originalFirstName2;
    user2.addresses = address2;

    // Execute atomic operations with meta.prefix
    const [address1Post, address2Post, user1Post, user2Post] = await jsonSdk
      .atomicFactory()
      .postOne(address1)
      .postOne(address2)
      .postOne(user1, { prefix })
      .postOne(user2, { prefix })
      .run();

    // Verify firstName has prefix applied for both users
    expect(user1Post.firstName).toBe(`${prefix}${originalFirstName1}`);
    expect(user2Post.firstName).toBe(`${prefix}${originalFirstName2}`);

    // Verify users are saved with prefixed firstName in database
    const user1FromServer = await jsonSdk.jsonApiSdkService.getOne(Users, user1Post.id);
    const user2FromServer = await jsonSdk.jsonApiSdkService.getOne(Users, user2Post.id);

    expect(user1FromServer.firstName).toBe(`${prefix}${originalFirstName1}`);
    expect(user2FromServer.firstName).toBe(`${prefix}${originalFirstName2}`);

    addressArray.push(address1Post, address2Post);
    usersId.push(user1Post.id, user2Post.id);
  });
});
