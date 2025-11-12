import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { TagAcl } from '../../../entities/acl-test';

export class TagFactory extends Factory<TagAcl> {
  model = TagAcl;

  definition(): Partial<TagAcl> {
    const name = faker.word.noun();
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      description: faker.lorem.sentence(),
      isOfficial: false,
    };
  }
}
