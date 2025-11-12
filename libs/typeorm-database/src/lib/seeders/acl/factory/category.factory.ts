import { faker } from '@faker-js/faker';
import { CategoryAcl } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';

export class CategoryFactory extends BaseFactory<CategoryAcl> {
  entity = CategoryAcl;

  protected attrs(): FactorizedAttrs<CategoryAcl> {
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
