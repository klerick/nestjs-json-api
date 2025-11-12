import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';

import { ArticleAcl, ArticleStatus, ArticleVisibility } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';

export class ArticleFactory extends BaseFactory<ArticleAcl> {
  entity = ArticleAcl;

  protected attrs(): FactorizedAttrs<ArticleAcl> {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(8),
      coAuthorIds: [],
      status: ArticleStatus.PUBLISHED,
      visibility: ArticleVisibility.PUBLIC,
      editor: null,
      metadata: {
        readTime: faker.number.int({ min: 5, max: 30 }),
        featured: true,
        premium: false,
      },
      publishedAt: faker.date.past(),
      expiresAt: null,
    };
  }
}
