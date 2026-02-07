import {
  Addresses,
  CommentKind,
  Comments,
  Users,
} from '@nestjs-json-api/typeorm-database';
import { faker } from '@faker-js/faker';

import { JsonSdkPromise } from '@klerick/json-api-nestjs-sdk';
import { getUser } from '../utils/data-utils';
import { creatSdk } from '../utils/run-application';

/**
 * Regression test: include relation whose entity has persist:false virtual properties.
 *
 * MikroORM Users entity has a `displayName` getter with `persist: false`.
 * When Comments includes `createdBy` (Users), the query builder must NOT
 * try to SELECT the non-existent `display_name` column.
 */
describe('JSON API: Include relation with virtual (persist:false) properties', () => {
  let jsonSdk: JsonSdkPromise;
  let user: Users;
  let comment: Comments;
  let address: Addresses;

  beforeAll(async () => {
    jsonSdk = creatSdk();

    address = await jsonSdk.jsonApiSdkService.postOne(
      Object.assign(new Addresses(), {
        city: faker.string.alpha(50),
        state: faker.string.alpha(50),
        country: faker.string.alpha(50),
      })
    );

    const newUser = getUser();
    newUser.addresses = address;
    user = await jsonSdk.jsonApiSdkService.postOne(newUser);

    const newComment = new Comments();
    newComment.text = faker.string.alpha(50);
    newComment.kind = CommentKind.Comment;
    comment = await jsonSdk.jsonApiSdkService.postOne(newComment);

    user.comments = [comment];
    await jsonSdk.jsonApiSdkService.patchOne(user);
  });

  afterAll(async () => {
    await jsonSdk.jsonApiSdkService.deleteRelationships(user, 'comments');
    await jsonSdk.jsonApiSdkService.deleteOne(comment);
    await jsonSdk.jsonApiSdkService.deleteOne(user);
    await jsonSdk.jsonApiSdkService.deleteOne(address);
  });

  it('should include createdBy relation on Comments without failing on virtual props', async () => {
    const result = await jsonSdk.jsonApiSdkService.getOne(
      Comments,
      comment.id,
      { include: ['createdBy'] }
    );

    expect(result).toBeDefined();
    expect(result.createdBy).toBeDefined();
    expect(result.createdBy!.id).toBe(user.id);
  });

  it('should getAll Comments with include createdBy', async () => {
    const results = await jsonSdk.jsonApiSdkService.getAll(Comments, {
      include: ['createdBy'],
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    const found = results.find((c) => c.id === comment.id);
    expect(found).toBeDefined();
    expect(found!.createdBy).toBeDefined();
    expect(found!.createdBy!.id).toBe(user.id);
  });
});