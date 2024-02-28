import { FactorizedAttrs, Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { CommentKind, Comments } from '../../entities';

export class CommentsFactory extends Factory<Comments> {
  protected entity = Comments;
  protected attrs(): FactorizedAttrs<Comments> {
    const text = faker.lorem.paragraph(faker.number.int(5));
    return {
      kind: CommentKind.Comment,
      text,
    };
  }

  constructor(protected dataSource: DataSource) {
    super();
  }
}
