import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { ArticleAcl, ArticleStatus, ArticleVisibility } from '../../../entities/acl-test';

export class ArticleFactory extends Factory<ArticleAcl> {
  model = ArticleAcl;

  definition(): Partial<ArticleAcl> {
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
