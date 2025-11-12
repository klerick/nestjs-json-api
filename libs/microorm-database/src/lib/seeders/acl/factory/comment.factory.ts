import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker';
import { CommentAcl } from '../../../entities/acl-test';

export class CommentFactory extends Factory<CommentAcl> {
  model = CommentAcl;

  definition(): Partial<CommentAcl> {
    return {
      content: faker.lorem.paragraph(),
      isApproved: true,
      isEdited: false,
    };
  }
}
