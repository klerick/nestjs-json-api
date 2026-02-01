/**
 * JSON API: POST Operations - Creating Resources
 *
 * This test suite demonstrates how to use the JSON API SDK to create new resources
 * with various relationship configurations.
 *
 * Examples include:
 * - Creating simple resources with attributes
 * - Creating resources with one-to-one relationships
 * - Creating resources with one-to-many relationships
 * - Automatic generation of timestamps and IDs
 * - Verifying relationships are properly linked
 */

import {
  Addresses,
  CommentKind,
  Comments,
  Users,
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';

import { creatSdk } from '../utils/run-application';

describe('Creating Resources (POST Operations) with entity() and plain structures', () => {
  let jsonSdk: JsonSdkPromise;
  let address: Addresses;
  let addressAfterSave: Addresses;
  let user: Users;
  let userAfterSave: Users;
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
      await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, commentsAfterSave)).deleteOne();
    if (userAfterSave) await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userAfterSave)).deleteOne();

    await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, addressAfterSave)).deleteOne();
  });

  it('should create a new resource and automatically generate id and timestamps', async () => {
    addressAfterSave = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();
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
    // entity().postOne() returns plain object
    expect(addressAfterSave.constructor.name).toBe('Object');
  });

  it('should create a resource with a one-to-one relationship and verify the relationship is properly linked', async () => {
    addressAfterSave = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();
    // For relationships, we need objects with proper constructor.name
    // Use entity(..., true) to get raw instance with correct type
    const addressRaw = jsonSdk.jsonApiSdkService.entity('Addresses', addressAfterSave, true);
    user.addresses = addressRaw;

    userAfterSave = await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, user)).postOne();
    const {
      id,
      createdAt,
      updatedAt,
      addresses: savedAddresses,
      ...newUser
    } = userAfterSave;
    const { addresses, ...userWithoutAddress } = user;

    expect(id).toBeDefined();
    expect(newUser).toEqual(userWithoutAddress);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);
    // Verify relationship is returned in response
    expect(savedAddresses).toBeDefined();
    expect(savedAddresses.id).toBe(addressAfterSave.id);

    const usersFromSerer = await jsonSdk.jsonApiSdkService.getOne(Users, id, {
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

  it('should create a resource with both one-to-one and one-to-many relationships', async () => {
    addressAfterSave = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();
    commentsAfterSave = await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, comments)).postOne();
    // For relationships, we need objects with proper constructor.name
    const addressRaw = jsonSdk.jsonApiSdkService.entity('Addresses', addressAfterSave, true);
    const commentsRaw = jsonSdk.jsonApiSdkService.entity('Comments', commentsAfterSave, true);
    user.addresses = addressRaw;
    user.comments = [commentsRaw];

    userAfterSave = await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, user)).postOne();

    const {
      id,
      createdAt,
      updatedAt,
      addresses: savedAddresses,
      comments: savedComments,
      ...newUser
    } = userAfterSave;
    const {
      addresses,
      comments: commentsFromUser,
      ...userWithoutAddress
    } = user;

    expect(id).toBeDefined();
    expect(newUser).toEqual(userWithoutAddress);
    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);
    // Verify relationships are returned in response
    expect(savedAddresses).toBeDefined();
    expect(savedAddresses.id).toBe(addressAfterSave.id);
    expect(savedComments).toBeDefined();
    expect(savedComments).toHaveLength(1);
    expect(savedComments[0].id).toBe(commentsAfterSave.id);

    const usersFromSerer = await jsonSdk.jsonApiSdkService.getOne(Users, id, {
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
    expect(commentsFromUser).toEqual(fromUser.comments);
  });
});
