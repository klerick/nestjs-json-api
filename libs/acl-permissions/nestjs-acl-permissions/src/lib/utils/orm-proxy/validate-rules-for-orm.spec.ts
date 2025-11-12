import { HttpException } from '@nestjs/common';
import { validateRulesForORM } from './validate-rules-for-orm';
import { AclRule } from '../../types';
import { ExtendAbility } from '../../factories';
import { RuleMaterializer } from '../../services';


describe('validateRulesForORM', () => {
  const subject = 'Post';
  const action = 'getAll';
  const materialize = new RuleMaterializer();

  it('should pass validation for rules without unsupported operators', () => {

    const validRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          authorId: { $eq: 123 },
          age: { $gte: 18, $lte: 65 },
          status: { $in: ['published', 'archived'] },
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      validRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should pass validation for rules with $or/$and/$not', () => {
    const validRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          $or: [
            { authorId: 123 },
            { $and: [{ verified: true }, { $not: { banned: true } }] },
          ],
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      validRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should pass validation for rules with transformable operators ($all, $regex, $nor)', () => {
    const validRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          name: { $regex: '^John' },
          tags: { $all: ['admin', 'moderator'] },
          $nor: [{ status: 'banned' }],
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      validRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should throw HttpException for $size operator', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          tags: { $size: 3 },
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should throw HttpException for $elemMatch operator', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          comments: {
            $elemMatch: { approved: true },
          },
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should throw HttpException for $options operator', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          name: { $regex: 'john', $options: 'i' },
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should throw HttpException for $where operator', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          $where: 'this.age > 18',
        } as any,
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should throw HttpException on first unsupported operator (fail-fast)', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          tags: { $size: 3 },
          comments: { $elemMatch: { approved: true } },
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should throw HttpException for nested unsupported operators in $or/$and', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        conditions: {
          // @ts-ignore
          $or: [
            { authorId: 123 },
            { tags: { $size: 5 } },
          ],
        },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });

  it('should pass validation for empty rules array', () => {
    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      [] as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should pass validation for rules without conditions', () => {
    const rulesWithoutConditions: AclRule[] = [
      {
        action,
        subject,
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      rulesWithoutConditions as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should pass validation for rules with only fields', () => {
    const rulesWithFields: AclRule[] = [
      {
        action,
        subject,
        fields: ['id', 'name', 'email'],
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      rulesWithFields as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).not.toThrow();
  });

  it('should throw HttpException with helpful message', () => {
    const invalidRules: AclRule[] = [
      {
        action,
        subject,
        // @ts-ignore
        conditions: { tags: { $size: 3 } },
      },
    ];

    const ability = new ExtendAbility(
      materialize,
      subject,
      action,
      invalidRules as any,
      {},
      {}
    );

    expect(() => validateRulesForORM(ability)).toThrow(HttpException);
  });
});
