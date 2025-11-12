import { FactorizedAttrs} from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { CommentKind, Comments } from '../../../entities';
import { BaseFactory } from '../../base-factory';

export class CommentsFactory extends BaseFactory<Comments> {
  protected entity = Comments;
  protected attrs(): FactorizedAttrs<Comments> {
    const text = faker.lorem.paragraph(faker.number.int(5));
    return {
      kind: CommentKind.Comment,
      text,
    };
  }
}
