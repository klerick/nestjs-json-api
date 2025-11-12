import { ExtendAbility } from './ability.factory';
import { RuleMaterializer } from '../services';

const mockLoggerDebug = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('@nestjs/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/common')>();
  return {
    ...actual,
    Logger: class Logger {
      debug = mockLoggerDebug;
      warn = mockLoggerWarn;
      error = mockLoggerError;
    },
  };
});

describe('ExtendAbility', () => {
  const subject = 'Users';
  const action = 'getAll';
  const materializeMock = vi.fn();
  const materialize = new RuleMaterializer();
  const currentUserId = 1;
  const userId = 2;
  const rules = [
    {
      action,
      subject,
      conditions: { authorId: '${currentUserId}' }, // Static
    },
    {
      action,
      subject,
      conditions: { userId: '${@input.userId}' }, // Dynamic
    },
  ] as any;

  it('Check Ability after init without input rules', () => {
    materializeMock.mockReturnValueOnce(rules);
    const extendAbility = new ExtendAbility(
      materialize,
      subject,
      action,
      rules,
      { currentUserId },
      {}
    );
    expect(extendAbility.rules).toEqual([
      { action, subject, conditions: { authorId: currentUserId } },
    ]);
  });

  it('Check Ability after call updateWithInput', () => {
    materializeMock.mockReturnValueOnce(rules);
    const extendAbility = new ExtendAbility(
      materialize,
      subject,
      action,
      rules,
      { currentUserId },
      {}
    );
    extendAbility.updateWithInput({ userId });

    expect(extendAbility.rules).toEqual([
      { action, subject, conditions: { authorId: currentUserId } },
      {
        action,
        subject,
        conditions: { userId: userId },
      },
    ]);
  });

  describe('getQueryObject', () => {
    it('should return empty object when no conditions', () => {
      const rulesWithoutConditions = [
        {
          action,
          subject,
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithoutConditions,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result).toEqual({});
    });

    it('should extract target fields from simple conditions', () => {
      const simpleRules = [
        {
          action,
          subject,
          conditions: { authorId: 123, status: 'published' },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        simpleRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: expect.arrayContaining(['authorId', 'status']),
      });
      // CASL wraps single rules in $or
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toEqual({
        authorId: 123,
        status: 'published',
      });
    });

    it('should extract relation fields and include', () => {
      const relationRules = [
        {
          action,
          subject,
          conditions: {
            authorId: 123,
            'profile.isPublic': true,
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        relationRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: ['authorId'],
        profile: ['isPublic'],
      });
      expect(result.include).toEqual(['profile']);
      // CASL wraps single rules in $or
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toEqual({
        authorId: 123,
        profile: { isPublic: true },
      });
    });

    it('should handle MongoDB operators', () => {
      const operatorRules = [
        {
          action,
          subject,
          conditions: {
            age: { $gte: 18, $lte: 65 },
            status: { $in: ['published', 'archived'] },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        operatorRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: expect.arrayContaining(['age', 'status']),
      });
      // CASL wraps single rules in $or
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toEqual({
        age: { $gte: 18, $lte: 65 },
        status: { $in: ['published', 'archived'] },
      });
    });

    it('should handle multiple rules with $or operator', () => {
      const multipleRules = [
        {
          action,
          subject,
          conditions: { authorId: 123 },
        },
        {
          action,
          subject,
          conditions: { 'profile.isPublic': true },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        multipleRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: ['authorId'],
        profile: ['isPublic'],
      });
      expect(result.include).toEqual(['profile']);
      expect(result.rulesForQuery).toHaveProperty('$or');
      // Order may vary
      expect((result.rulesForQuery as any).$or).toEqual(
        expect.arrayContaining([
          { authorId: 123 },
          { profile: { isPublic: true } },
        ])
      );
    });

    it('should handle inverted rules (cannot)', () => {
      const invertedRules = [
        {
          action,
          subject,
          conditions: { authorId: 123 },
        },
        {
          action,
          subject,
          conditions: { status: 'draft' },
          inverted: true,
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        invertedRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: expect.arrayContaining(['authorId', 'status']),
      });
      expect(result.rulesForQuery).toHaveProperty('$and');
    });

    it('should extract fields from nested $or operator', () => {
      const nestedRules = [
        {
          action,
          subject,
          conditions: {
            $or: [
              { authorId: 123 },
              { 'profile.isPublic': true },
              { status: 'published' },
            ],
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        nestedRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: expect.arrayContaining(['authorId', 'status']),
        profile: ['isPublic'],
      });
      expect(result.include).toEqual(['profile']);
      expect(result.rulesForQuery).toHaveProperty('$or');
    });

    it('should handle complex nested operators', () => {
      const complexRules = [
        {
          action,
          subject,
          conditions: {
            $and: [
              {
                $or: [{ authorId: 123 }, { 'profile.role': 'admin' }],
              },
              { status: 'published' },
            ],
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        complexRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: expect.arrayContaining(['authorId', 'status']),
        profile: ['role'],
      });
      expect(result.include).toEqual(['profile']);
      // CASL wraps single rules in $or, with nested $and
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toHaveProperty('$and');
    });

    it('should handle multiple relations', () => {
      const multiRelationRules = [
        {
          action,
          subject,
          conditions: {
            'profile.isPublic': true,
            'comments.approved': true,
            authorId: 123,
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        multiRelationRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        target: ['authorId'],
        profile: ['isPublic'],
        comments: ['approved'],
      });
      expect(result.include).toEqual(
        expect.arrayContaining(['profile', 'comments'])
      );
      // CASL wraps single rules in $or
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toEqual({
        authorId: 123,
        profile: { isPublic: true },
        comments: { approved: true },
      });
    });

    it('should transform relation fields correctly', () => {
      const transformRules = [
        {
          action,
          subject,
          conditions: {
            'profile.name': 'John',
            'profile.age': { $gte: 18 },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        transformRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields).toEqual({
        profile: expect.arrayContaining(['name', 'age']),
      });
      expect(result.include).toEqual(['profile']);
      // CASL wraps single rules in $or
      expect(result.rulesForQuery).toHaveProperty('$or');
      expect((result.rulesForQuery as any).$or[0]).toEqual({
        profile: {
          name: 'John',
          age: { $gte: 18 },
        },
      });
    });

    it('should not return rulesForQuery when it is empty', () => {
      const emptyConditionsRules = [
        {
          action,
          subject,
          conditions: {},
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        emptyConditionsRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      // CASL may return {$or: [{}]} for empty conditions, we filter it out
      // So result should not have rulesForQuery or it should be empty
      if (result.rulesForQuery) {
        // If it exists, check it's empty or has only empty objects
        const keys = Object.keys(result.rulesForQuery);
        expect(keys.length).toBe(0);
      }
    });

    it('should deduplicate fields from multiple conditions', () => {
      const duplicateRules = [
        {
          action,
          subject,
          conditions: {
            authorId: 123,
            status: 'published',
          },
        },
        {
          action,
          subject,
          conditions: {
            authorId: 456,
            category: 'news',
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        duplicateRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.fields?.target).toEqual(
        expect.arrayContaining(['authorId', 'status', 'category'])
      );
      // Should not have duplicates
      expect(result.fields?.target?.length).toBe(3);
    });
  });

  describe('hasConditions and hasFields getters', () => {
    it('should return false when no conditions and no fields', () => {
      const rulesNoConditionsNoFields = [
        {
          action,
          subject,
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesNoConditionsNoFields,
        {},
        {}
      );

      expect(ability.hasConditions).toBe(false);
      expect(ability.hasFields).toBe(false);
    });

    it('should return true for hasConditions when conditions exist', () => {
      const rulesWithConditions = [
        {
          action,
          subject,
          conditions: { authorId: 123 },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithConditions,
        {},
        {}
      );

      expect(ability.hasConditions).toBe(true);
      expect(ability.hasFields).toBe(false);
    });

    it('should return true for hasFields when fields exist', () => {
      const rulesWithFields = [
        {
          action,
          subject,
          fields: ['id', 'name'],
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithFields,
        {},
        {}
      );

      expect(ability.hasConditions).toBe(false);
      expect(ability.hasFields).toBe(true);
    });

    it('should return true for both when conditions and fields exist', () => {
      const rulesWithBoth = [
        {
          action,
          subject,
          conditions: { authorId: 123 },
          fields: ['id', 'name'],
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithBoth,
        {},
        {}
      );

      expect(ability.hasConditions).toBe(true);
      expect(ability.hasFields).toBe(true);
    });

    it('should return correct values with multiple rules', () => {
      const mixedRules = [
        {
          action,
          subject,
          conditions: { authorId: 123 },
        },
        {
          action,
          subject,
          fields: ['id', 'name'],
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        mixedRules,
        {},
        {}
      );

      expect(ability.hasConditions).toBe(true);
      expect(ability.hasFields).toBe(true);
    });
  });

  describe('MikroORM operator transformation', () => {
    it('should transform $regex to $re in field values', () => {
      const rulesWithRegex = [
        {
          action,
          subject,
          conditions: {
            name: { $regex: '^John' },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithRegex,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            name: { $re: '^John' },
          },
        ],
      });
    });

    it('should transform $all to $contains in field values', () => {
      const rulesWithAll = [
        {
          action,
          subject,
          conditions: {
            tags: { $all: ['admin', 'moderator'] },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithAll,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            tags: { $contains: ['admin', 'moderator'] },
          },
        ],
      });
    });

    it('should transform $nor to $not: { $or: [...] }', () => {
      const rulesWithNor = [
        {
          action,
          subject,
          conditions: {
            $nor: [{ status: 'banned' }, { status: 'deleted' }],
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithNor,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            $not: {
              $or: [{ status: 'banned' }, { status: 'deleted' }],
            },
          },
        ],
      });
    });

    it('should transform operators in nested $or/$and', () => {
      const rulesWithNestedOperators = [
        {
          action,
          subject,
          conditions: {
            $or: [
              { name: { $regex: '^John' } },
              { tags: { $all: ['admin'] } },
            ],
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithNestedOperators,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            $or: [
              { name: { $re: '^John' } },
              { tags: { $contains: ['admin'] } },
            ],
          },
        ],
      });
    });

    it('should transform operators in relation fields', () => {
      const rulesWithRelationOperators = [
        {
          action,
          subject,
          conditions: {
            'profile.name': { $regex: '^John' },
            'profile.tags': { $all: ['verified'] },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithRelationOperators,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            profile: {
              name: { $re: '^John' },
              tags: { $contains: ['verified'] },
            },
          },
        ],
      });
      expect(result.fields?.profile).toEqual(['name', 'tags']);
      expect(result.include).toEqual(['profile']);
    });

    it('should handle multiple transformations in complex query', () => {
      const complexRules = [
        {
          action,
          subject,
          conditions: {
            $or: [
              { name: { $regex: '^Admin' } },
              {
                $and: [
                  { tags: { $all: ['moderator'] } },
                  { $nor: [{ status: 'banned' }] },
                ],
              },
            ],
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        complexRules,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            $or: [
              { name: { $re: '^Admin' } },
              {
                $and: [
                  { tags: { $contains: ['moderator'] } },
                  {
                    $not: {
                      $or: [{ status: 'banned' }],
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('should preserve other operators unchanged', () => {
      const rulesWithStandardOperators = [
        {
          action,
          subject,
          conditions: {
            age: { $gte: 18, $lte: 65 },
            role: { $in: ['admin', 'moderator'] },
            status: { $ne: 'deleted' },
          },
        },
      ] as any;

      const ability = new ExtendAbility(
        materialize,
        subject,
        action,
        rulesWithStandardOperators,
        {},
        {}
      );

      const result = ability.getQueryObject();

      expect(result.rulesForQuery).toEqual({
        $or: [
          {
            age: { $gte: 18, $lte: 65 },
            role: { $in: ['admin', 'moderator'] },
            status: { $ne: 'deleted' },
          },
        ],
      });
    });
  });
});
