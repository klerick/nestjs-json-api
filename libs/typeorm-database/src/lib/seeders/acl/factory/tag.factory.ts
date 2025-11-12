import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';

import { TagAcl } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';

export class TagFactory extends BaseFactory<TagAcl> {
  entity = TagAcl;

  protected attrs(): FactorizedAttrs<TagAcl> {
    const name = faker.word.noun();
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      description: faker.lorem.sentence(),
      isOfficial: false,
    };
  }
}
