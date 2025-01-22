import { Addresses, BookList, CommentKind, Comments, Users } from 'database';
import { faker } from '@faker-js/faker';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';

import { creatSdk, run } from '../utils/run-application';
import { INestApplication } from '@nestjs/common';
let app: INestApplication;

beforeAll(async () => {
  app = await run();
});

afterAll(async () => {
  await app.close();
});

describe('POST method:', () => {
  let jsonSdk: JsonSdkPromise;
  let address: Addresses;
  let addressAfterSave: Addresses;
  let user: Users;
  let userAfterSave: Users;
  let bookListAfterSave: BookList;
  let comments: Comments;
  let commentsAfterSave: Comments;

  beforeEach(() => {
    jsonSdk = creatSdk();

    address = new Addresses();
    address.city = faker.string.alpha(50);
    address.state = faker.string.alpha(50);
    address.country = faker.string.alpha(50);

    user = new Users();
    user.firstName = faker.string.alpha(50);
    user.lastName = faker.string.alpha(50);
    user.login = faker.string.alpha(50);
    user.isActive = faker.datatype.boolean(0.5);

    comments = new Comments();
    comments.text = faker.string.alpha(50);
    comments.kind = CommentKind.Comment;
  });

  afterEach(async () => {
    if (commentsAfterSave)
      await jsonSdk.jonApiSdkService.deleteOne(commentsAfterSave);
    if (userAfterSave) await jsonSdk.jonApiSdkService.deleteOne(userAfterSave);
    if (bookListAfterSave)
      await jsonSdk.jonApiSdkService.deleteOne(bookListAfterSave);

    await jsonSdk.jonApiSdkService.deleteOne(addressAfterSave);
  });

  it('Should be create Entity', async () => {
    addressAfterSave = await jsonSdk.jonApiSdkService.postOne(address);
    const {
      id: addressId,
      createdAt,
      updatedAt,
      ...newAddress
    } = addressAfterSave;

    expect(addressId).toBeDefined();
    expect(newAddress).toEqual(address);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);
  });

  it('Should be create Entity with relations', async () => {
    addressAfterSave = await jsonSdk.jonApiSdkService.postOne(address);
    user.addresses = addressAfterSave;

    userAfterSave = await jsonSdk.jonApiSdkService.postOne(user);
    const { id, createdAt, updatedAt, ...newUser } = userAfterSave;
    const { addresses, ...userWithoutAddress } = user;

    expect(id).toBeDefined();
    expect(newUser).toEqual(userWithoutAddress);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);

    const usersFromSerer = await jsonSdk.jonApiSdkService.getOne(Users, id, {
      include: ['addresses'],
    });
    const {
      id: fromId,
      createdAt: fromCreatedAt,
      updatedAt: fromUpdatedAt,
      ...fromUser
    } = usersFromSerer;

    expect(id).toBe(fromId);
    expect(user).toEqual(fromUser);
    expect(fromCreatedAt).toBeInstanceOf(Date);
    expect(fromUpdatedAt).toBeInstanceOf(Date);
    expect(addresses).toEqual(fromUser.addresses);
  });

  it('Should be create Entity with relations array', async () => {
    addressAfterSave = await jsonSdk.jonApiSdkService.postOne(address);
    commentsAfterSave = await jsonSdk.jonApiSdkService.postOne(comments);
    user.addresses = addressAfterSave;
    user.comments = [commentsAfterSave];

    userAfterSave = await jsonSdk.jonApiSdkService.postOne(user);

    const { id, createdAt, updatedAt, ...newUser } = userAfterSave;
    const {
      addresses,
      comments: comentsFromuser,
      ...userWithoutAddress
    } = user;

    expect(id).toBeDefined();
    expect(newUser).toEqual(userWithoutAddress);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);

    const usersFromSerer = await jsonSdk.jonApiSdkService.getOne(Users, id, {
      include: ['addresses', 'comments'],
    });
    const {
      id: fromId,
      createdAt: fromCreatedAt,
      updatedAt: fromUpdatedAt,
      ...fromUser
    } = usersFromSerer;

    expect(id).toBe(fromId);
    user.comments[0].updatedAt = fromUser.comments[0].updatedAt;
    expect(user).toEqual(fromUser);
    expect(fromCreatedAt).toBeInstanceOf(Date);
    expect(fromUpdatedAt).toBeInstanceOf(Date);
    expect(addresses).toEqual(fromUser.addresses);
    expect(comentsFromuser).toEqual(fromUser.comments);
  });
});
