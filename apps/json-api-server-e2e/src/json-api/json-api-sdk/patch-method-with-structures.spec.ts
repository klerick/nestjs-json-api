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

    // For relationships, we need objects with proper constructor.name
    // Use entity(..., true) to get raw instance with correct type
    const addressPlain = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, address)).postOne();
    addressAfterSave = jsonSdk.jsonApiSdkService.entity('Addresses', addressPlain, true);

    comments = new Comments();
    comments.text = faker.string.alpha(50);
    comments.kind = CommentKind.Comment;

    const commentsPlain = await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, comments)).postOne();
    commentsAfterSave = jsonSdk.jsonApiSdkService.entity('Comments', commentsPlain, true);

    user = new Users();
    user.firstName = faker.string.alpha(50);
    user.lastName = faker.string.alpha(50);
    user.login = faker.string.alpha(50);
    user.isActive = faker.datatype.boolean(0.5);
    user.addresses = addressAfterSave;
    user.comments = [commentsAfterSave];

    const userPlain = await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, user)).postOne();
    userAfterSave = jsonSdk.jsonApiSdkService.entity('Users', userPlain, true);
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, commentsAfterSave)).deleteOne();
    if (newCommentsAfterSave){
      await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, newCommentsAfterSave)).deleteOne();
    }
    await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userAfterSave)).deleteOne();
    await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, addressAfterSave)).deleteOne();
    if (newAddressAfterSave) {
      jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, newAddressAfterSave)).deleteOne();
    }
  });

  it('should update resource attributes and automatically update the updatedAt timestamp', async () => {
    addressAfterSave.city = faker.location.city();
    const addressAfterUpdate = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, addressAfterSave)).patchOne();
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

    const newAddressPlain = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, newAddress)).postOne();
    newAddressAfterSave = jsonSdk.jsonApiSdkService.entity('Addresses', newAddressPlain, true);

    const newCommentsPlain = await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, newComments)).postOne();
    newCommentsAfterSave = jsonSdk.jsonApiSdkService.entity('Comments', newCommentsPlain, true);

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];
    await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userAfterSave)).patchOne();
    const userAfterUpdate = await jsonSdk.jsonApiSdkService.getOne<Users>(
      'Users',
      userAfterSave.id,
      { include: ['addresses', 'comments'] }
    );
    expect(userAfterUpdate.addresses).toEqual(newAddressPlain);
    newCommentsPlain.updatedAt = userAfterUpdate.comments[0].updatedAt;
    expect(userAfterUpdate.comments[0]).toEqual(newCommentsPlain);
  });

  it('should update only relationships without modifying other attributes using partial resource object', async () => {
    const newAddress = new Addresses();
    newAddress.city = faker.location.city();
    newAddress.state = faker.location.state();
    newAddress.country = faker.location.country();

    const newComments = new Comments();
    newComments.text = faker.string.alpha();
    newComments.kind = CommentKind.Comment;

    const newAddressPlain = await jsonSdk.jsonApiSdkService.entity('Addresses', Object.assign({}, newAddress)).postOne();
    newAddressAfterSave = jsonSdk.jsonApiSdkService.entity('Addresses', newAddressPlain, true);

    const newCommentsPlain = await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, newComments)).postOne();
    newCommentsAfterSave = jsonSdk.jsonApiSdkService.entity('Comments', newCommentsPlain, true);

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];

    const userWithEmptyAttr = new Users();
    userWithEmptyAttr.id = userAfterSave.id;
    userWithEmptyAttr.addresses = newAddressAfterSave;
    userWithEmptyAttr.comments = [newCommentsAfterSave];
    userWithEmptyAttr.lastName = null as any;

    await jsonSdk.jsonApiSdkService.entity('Users', Object.assign({}, userWithEmptyAttr)).patchOne();
    const userAfterUpdate = await jsonSdk.jsonApiSdkService.getOne(
      Users,
      userWithEmptyAttr.id,
      { include: ['addresses', 'comments'] }
    );
    expect(userAfterUpdate.addresses).toEqual(newAddressPlain);
    newCommentsPlain.updatedAt = userAfterUpdate.comments[0].updatedAt;
    expect(userAfterUpdate.comments[0]).toEqual(newCommentsPlain);

  });

  it('Try set null for relationship', async () => {

    const commentsWithEmptyAttr = new Comments();
    commentsWithEmptyAttr.id = commentsAfterSave.id;
    commentsWithEmptyAttr.createdBy = nullRef();
    await jsonSdk.jsonApiSdkService.entity('Comments', Object.assign({}, commentsWithEmptyAttr)).patchOne();

    const commentsAfterUpdate = await jsonSdk.jsonApiSdkService.getOne(
      Comments,
      commentsWithEmptyAttr.id,
      { include: ['createdBy'] }
    );
    expect(commentsAfterUpdate.createdBy).toBeUndefined();
  })
});
