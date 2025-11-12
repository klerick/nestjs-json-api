import { faker } from '@faker-js/faker';
import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { CommentAcl } from '../../../entities/acl-test';
import { BaseFactory } from '../../base-factory';


export class CommentFactory extends BaseFactory<CommentAcl> {
  entity = CommentAcl;

  protected attrs(): FactorizedAttrs<CommentAcl> {
    return {
      content: faker.lorem.paragraph(),
      isApproved: true,
      isEdited: false,
    };
  }
}
