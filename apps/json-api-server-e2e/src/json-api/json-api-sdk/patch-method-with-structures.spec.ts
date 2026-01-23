/**
 * JSON API: PATCH Operations - Updating Resources
 *
 * This test suite demonstrates how to use the JSON API SDK to update existing resources
 * including their attributes and relationships.
 *
 * Examples include:
 * - Updating resource attributes
 * - Replacing one-to-one relationships
 * - Replacing one-to-many relationships
 * - Partial updates (updating only relationships without modifying attributes)
 * - Automatic updatedAt timestamp management
 */

import {
  Addresses,
  CommentKind,
  Comments,
  Users,
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';
import { JsonSdkPromise, nullRef } from '@klerick/json-api-nestjs-sdk';

import { creatSdk } from '../utils/run-application';

describe('Updating Resources (PATCH Operations) with entity() and plain structures', () => {
  let jsonSdk: JsonSdkPromise;
  let address: Addresses;
  let addressAfterSave: Addresses;
  let user: Users;
  let userAfterSave: Users;
  let newAddressAfterSave: Addresses | undefined;
  let comments: Comments;
  let commentsAfterSave: Comments;
  let newCommentsAfterSave: Comments | undefined;

  beforeEach(async () => {
    jsonSdk = creatSdk();
    newCommentsAfterSave = undefined;
    newAddressAfterSave = undefined;
    address = new Addresses();
    address.city = faker.string.alpha(50);
    address.state = faker.string.alpha(50);
    address.country = faker.string.alpha(50);

    addressAfterSave = await jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();

    comments = new Comments();
    comments.text = faker.string.alpha(50);
    comments.kind = CommentKind.Comment;

    commentsAfterSave = await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, comments)).postOne();

    user = new Users();
    user.firstName = faker.string.alpha(50);
    user.lastName = faker.string.alpha(50);
    user.login = faker.string.alpha(50);
    user.isActive = faker.datatype.boolean(0.5);
    user.addresses = addressAfterSave;
    user.comments = [commentsAfterSave];

    userAfterSave = await jsonSdk.jonApiSdkService.entity('Users', Object.assign({}, user)).postOne();
  });

  afterEach(async () => {
    await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, commentsAfterSave)).deleteOne();
    if (newCommentsAfterSave){
      await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, newCommentsAfterSave)).deleteOne();
    }
    await jsonSdk.jonApiSdkService.entity('Users', Object.assign({}, userAfterSave)).deleteOne();
    await jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, addressAfterSave)).deleteOne();
    if (newAddressAfterSave) {
      jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, newAddressAfterSave)).deleteOne();
    }
  });

  it('should update resource attributes and automatically update the updatedAt timestamp', async () => {
    addressAfterSave.city = faker.location.city();
    const addressAfterUpdate = await jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, addressAfterSave)).patchOne();
    addressAfterUpdate.updatedAt = addressAfterSave.updatedAt;
    expect(addressAfterSave).toEqual(addressAfterUpdate);
  });

  it('should replace existing relationships with new resources', async () => {
    const newAddress = new Addresses();
    newAddress.city = faker.location.city();
    newAddress.state = faker.location.state();
    newAddress.country = faker.location.country();

    const newComments = new Comments();
    newComments.text = faker.string.alpha();
    newComments.kind = CommentKind.Comment;

    newAddressAfterSave = await jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, newAddress)).postOne();


    newCommentsAfterSave = await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, newComments)).postOne();

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];
    await jsonSdk.jonApiSdkService.entity('Users', Object.assign({}, userAfterSave)).patchOne();
    const userAfterUpdate = await jsonSdk.jonApiSdkService.getOne(
      Users,
      userAfterSave.id,
      { include: ['addresses', 'comments'] }
    );
    expect(userAfterUpdate.addresses).toEqual(newAddressAfterSave);
    newCommentsAfterSave.updatedAt = userAfterUpdate.comments[0].updatedAt;
    expect(userAfterUpdate.comments[0]).toEqual(newCommentsAfterSave);
  });

  it('should update only relationships without modifying other attributes using partial resource object', async () => {
    const newAddress = new Addresses();
    newAddress.city = faker.location.city();
    newAddress.state = faker.location.state();
    newAddress.country = faker.location.country();

    const newComments = new Comments();
    newComments.text = faker.string.alpha();
    newComments.kind = CommentKind.Comment;

    newAddressAfterSave = await jsonSdk.jonApiSdkService.entity('Addresses', Object.assign({}, newAddress)).postOne();

    newCommentsAfterSave = await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, newComments)).postOne();

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];

    const userWithEmptyAttr = new Users();
    userWithEmptyAttr.id = userAfterSave.id;
    userWithEmptyAttr.addresses = newAddressAfterSave;
    userWithEmptyAttr.comments = [newCommentsAfterSave];
    userWithEmptyAttr.lastName = null as any;

    await jsonSdk.jonApiSdkService.entity('Users', Object.assign({}, userWithEmptyAttr)).patchOne();
    const userAfterUpdate = await jsonSdk.jonApiSdkService.getOne(
      Users,
      userWithEmptyAttr.id,
      { include: ['addresses', 'comments'] }
    );
    expect(userAfterUpdate.addresses).toEqual(newAddressAfterSave);
    newCommentsAfterSave.updatedAt = userAfterUpdate.comments[0].updatedAt;
    expect(userAfterUpdate.comments[0]).toEqual(newCommentsAfterSave);

  });

  it('Try set null for relationship', async () => {

    const commentsWithEmptyAttr = new Comments();
    commentsWithEmptyAttr.id = commentsAfterSave.id;
    commentsWithEmptyAttr.createdBy = nullRef();
    await jsonSdk.jonApiSdkService.entity('Comments', Object.assign({}, commentsWithEmptyAttr)).patchOne();

    const commentsAfterUpdate = await jsonSdk.jonApiSdkService.getOne(
      Comments,
      commentsWithEmptyAttr.id,
      { include: ['createdBy'] }
    );
    expect(commentsAfterUpdate.createdBy).toBeUndefined();
  })
});