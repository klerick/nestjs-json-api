import { Factory } from '@mikro-orm/seeder';
import { Comments } from '../../../entities';

import { faker } from '@faker-js/faker';
import { CommentKind } from '@nestjs-json-api/typeorm-database';

export class CommentsFactory extends Factory<Comments> {
  model = Comments;

  definition(): Partial<Comments> {
    return {
      kind: CommentKind.Comment,
      text: faker.lorem.paragraph(faker.number.int(5)),
    };
  }
}
