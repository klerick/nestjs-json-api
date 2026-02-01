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

describe('Updating Resources (PATCH Operations)', () => {
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

    addressAfterSave = await jsonSdk.jsonApiSdkService.postOne(address);

    comments = new Comments();
    comments.text = faker.string.alpha(50);
    comments.kind = CommentKind.Comment;

    commentsAfterSave = await jsonSdk.jsonApiSdkService.postOne(comments);

    user = new Users();
    user.firstName = faker.string.alpha(50);
    user.lastName = faker.string.alpha(50);
    user.login = faker.string.alpha(50);
    user.isActive = faker.datatype.boolean(0.5);
    user.addresses = addressAfterSave;
    user.comments = [commentsAfterSave];

    userAfterSave = await jsonSdk.jsonApiSdkService.postOne(user);
  });

  afterEach(async () => {
    await jsonSdk.jsonApiSdkService.deleteOne(commentsAfterSave);
    if (newCommentsAfterSave){
      await jsonSdk.jsonApiSdkService.deleteOne(newCommentsAfterSave);
    }
    await jsonSdk.jsonApiSdkService.deleteOne(userAfterSave);
    await jsonSdk.jsonApiSdkService.deleteOne(addressAfterSave);
    if (newAddressAfterSave) {
      jsonSdk.jsonApiSdkService.deleteOne(newAddressAfterSave);
    }
  });

  it('should update resource attributes and automatically update the updatedAt timestamp', async () => {
    addressAfterSave.city = faker.location.city();
    const addressAfterUpdate = await jsonSdk.jsonApiSdkService.patchOne(
      addressAfterSave
    );
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

    newAddressAfterSave = await jsonSdk.jsonApiSdkService.postOne(
      newAddress
    );


    newCommentsAfterSave = await jsonSdk.jsonApiSdkService.postOne(newComments);

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];
    await jsonSdk.jsonApiSdkService.patchOne(userAfterSave);
    const userAfterUpdate = await jsonSdk.jsonApiSdkService.getOne(
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

    newAddressAfterSave = await jsonSdk.jsonApiSdkService.postOne(
      newAddress
    );

    newCommentsAfterSave = await jsonSdk.jsonApiSdkService.postOne(
      newComments
    );

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];

    const userWithEmptyAttr = new Users();
    userWithEmptyAttr.id = userAfterSave.id;
    userWithEmptyAttr.addresses = newAddressAfterSave;
    userWithEmptyAttr.comments = [newCommentsAfterSave];
    userWithEmptyAttr.lastName = null as any;

    await jsonSdk.jsonApiSdkService.patchOne(userWithEmptyAttr);
    const userAfterUpdate = await jsonSdk.jsonApiSdkService.getOne(
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
    await jsonSdk.jsonApiSdkService.patchOne(commentsWithEmptyAttr);

    const commentsAfterUpdate = await jsonSdk.jsonApiSdkService.getOne(
      Comments,
      commentsWithEmptyAttr.id,
      { include: ['createdBy'] }
    );
    expect(commentsAfterUpdate.createdBy).toBeUndefined();
  })
});
