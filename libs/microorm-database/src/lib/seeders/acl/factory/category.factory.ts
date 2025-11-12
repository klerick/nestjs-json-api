import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { CategoryAcl } from '../../../entities/acl-test';

export class CategoryFactory extends Factory<CategoryAcl> {
  model = CategoryAcl;

  definition(): Partial<CategoryAcl> {
    const name = faker.word.words(2);
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      description: faker.lorem.sentence(),
      parent: null,
      level: 0,
      isActive: true,
    };
  }
}
