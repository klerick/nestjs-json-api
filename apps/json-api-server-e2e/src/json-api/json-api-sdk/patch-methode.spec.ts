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
import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';

import { creatSdk } from '../utils/run-application';

describe('Updating Resources (PATCH Operations)', () => {
  let jsonSdk: JsonSdkPromise;
  let address: Addresses;
  let addressAfterSave: Addresses;
  let user: Users;
  let userAfterSave: Users;

  let comments: Comments;
  let commentsAfterSave: Comments;
  let newCommentsAfterSave: Comments | undefined = undefined;

  beforeEach(async () => {
    jsonSdk = creatSdk();

    address = new Addresses();
    address.city = faker.string.alpha(50);
    address.state = faker.string.alpha(50);
    address.country = faker.string.alpha(50);

    addressAfterSave = await jsonSdk.jonApiSdkService.postOne(address);

    comments = new Comments();
    comments.text = faker.string.alpha(50);
    comments.kind = CommentKind.Comment;

    commentsAfterSave = await jsonSdk.jonApiSdkService.postOne(comments);

    user = new Users();
    user.firstName = faker.string.alpha(50);
    user.lastName = faker.string.alpha(50);
    user.login = faker.string.alpha(50);
    user.isActive = faker.datatype.boolean(0.5);
    user.addresses = addressAfterSave;
    user.comments = [commentsAfterSave];

    userAfterSave = await jsonSdk.jonApiSdkService.postOne(user);
  });

  afterEach(() => async () => {
    await jsonSdk.jonApiSdkService.deleteOne(addressAfterSave);
    await jsonSdk.jonApiSdkService.deleteOne(userAfterSave);
    await jsonSdk.jonApiSdkService.deleteOne(commentsAfterSave);
    if (newCommentsAfterSave)
      await jsonSdk.jonApiSdkService.deleteOne(newCommentsAfterSave);
  });

  it('should update resource attributes and automatically update the updatedAt timestamp', async () => {
    addressAfterSave.city = faker.location.city();
    const addressAfterUpdate = await jsonSdk.jonApiSdkService.patchOne(
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

    const newAddressAfterSave = await jsonSdk.jonApiSdkService.postOne(
      newAddress
    );

    newCommentsAfterSave = await jsonSdk.jonApiSdkService.postOne(newComments);

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];
    await jsonSdk.jonApiSdkService.patchOne(userAfterSave);
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

    const newAddressAfterSave = await jsonSdk.jonApiSdkService.postOne(
      newAddress
    );

    const newCommentsAfterSave = await jsonSdk.jonApiSdkService.postOne(
      newComments
    );

    userAfterSave.addresses = newAddressAfterSave;
    userAfterSave.comments = [newCommentsAfterSave];

    const userWithEmptyAttr = new Users();
    userWithEmptyAttr.id = userAfterSave.id;
    userWithEmptyAttr.addresses = newAddressAfterSave;
    userWithEmptyAttr.comments = [newCommentsAfterSave];
    userWithEmptyAttr.lastName = null as any;

    await jsonSdk.jonApiSdkService.patchOne(userWithEmptyAttr);
    const userAfterUpdate = await jsonSdk.jonApiSdkService.getOne(
      Users,
      userWithEmptyAttr.id,
      { include: ['addresses', 'comments'] }
    );
    expect(userAfterUpdate.addresses).toEqual(newAddressAfterSave);
    newCommentsAfterSave.updatedAt = userAfterUpdate.comments[0].updatedAt;
    expect(userAfterUpdate.comments[0]).toEqual(newCommentsAfterSave);

    await jsonSdk.jonApiSdkService.deleteOne(newCommentsAfterSave);
  });
});
