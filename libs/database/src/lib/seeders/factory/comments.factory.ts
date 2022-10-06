import {FactorizedAttrs, Factory} from '@jorgebodega/typeorm-factory';
import {CommentKind, Comments} from '@nestjs-json-api/database';
import {faker} from '@faker-js/faker';
import {DataSource} from 'typeorm';

export class CommentsFactory extends Factory<Comments> {
  protected entity = Comments;
  protected attrs(): FactorizedAttrs<Comments> {
    const text = faker.lorem.paragraph(
      faker.datatype.number(5)
    );
    return {
      kind: CommentKind.Comment,
      text
    };
  }

  constructor(protected dataSource: DataSource) {
    super();
  }
}
