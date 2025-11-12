import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { PostAcl, PostStatus } from '../../../entities/acl-test';

export class PostFactory extends Factory<PostAcl> {
  model = PostAcl;

  definition(): Partial<PostAcl> {
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
