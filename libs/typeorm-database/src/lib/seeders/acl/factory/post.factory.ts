import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';


import { PostAcl, PostStatus } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';

export class PostFactory extends BaseFactory<PostAcl> {
  entity = PostAcl;

  protected attrs(): FactorizedAttrs<PostAcl> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(5),
      excerpt: faker.lorem.paragraph(),
      status: PostStatus.PUBLISHED,
      isPublished: true,
      publishedAt: faker.date.past(),
      viewCount: faker.number.int({ min: 0, max: 5000 }),
    };
  }
}
