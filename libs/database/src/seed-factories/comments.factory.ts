import { define } from 'typeorm-seeding';
import * as faker from 'faker';

import { CommentKind } from "../entities";
import { Comments } from '../entities';


define(Comments, () => {
  const comments = new Comments();
  const kind = faker.random.arrayElement(
    Object.values(CommentKind)
  );

  comments.text = faker.lorem.paragraph(
    faker.datatype.number(5)
  );
  comments.kind = kind;

  return comments;
});
