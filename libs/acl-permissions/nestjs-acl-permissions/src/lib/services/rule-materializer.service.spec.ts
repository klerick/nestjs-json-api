import { expect } from 'vitest';
import { RuleMaterializer } from './rule-materializer.service';
import { TestBed } from '@suites/unit';
import { ACL_MODULE_OPTIONS } from '../constants';
import { AbilityTuple, MongoQuery, RawRuleFrom } from '@casl/ability';

vi.mock('@nestjs/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/common')>();
  return {
    ...actual,
    Logger: class Logger {
      debug = vi.fn();
      warn = vi.fn();
      error = vi.fn();
    },
  };
});

describe('RuleMaterializer', () => {
  describe('Non-strict mode', () => {
    let materializer: RuleMaterializer;

    beforeEach(async () => {

      const { unit } = await TestBed.solitary(RuleMaterializer)
        .mock(ACL_MODULE_OPTIONS)
        .impl(() => ({
          strictInterpolation: false,
        }))
        .compile();
      materializer = unit;
    });

    describe('Simple variable interpolation', () => {
      it('should interpolate simple string variable with subject as class', () => {
        class User {}
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: User,
            conditions: { name: '${userName}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userName: 'John' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: User.name,
            conditions: { name: 'John' },
          },
        ]);
      });

      it('should interpolate simple string variable', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { name: '${userName}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userName: 'John' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { name: 'John' },
          },
        ]);
      });

      it('should interpolate number variable', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: '${userId}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userId: 123 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: 123 },
          },
        ]);
      });

      it('should interpolate boolean variable', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { published: '${isPublished}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { isPublished: true },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { published: true },
          },
        ]);
      });

      it('should interpolate array variable', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: '${groupIds}' } },
          },
        ];

        const result = materializer.materialize(
          rules,
          { groupIds: [1, 5, 8] },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: [1, 5, 8] } },
          },
        ]);
      });

      it('should interpolate null value', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { deletedAt: '${deletedAt}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { deletedAt: null },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { deletedAt: null },
          },
        ]);
      });

      it('should interpolate Date value', () => {
        const date = new Date('2025-01-15T10:30:00.000Z');
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { createdAfter: '${createdDate}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { createdDate: date },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { createdAfter: date.toISOString() },
          },
        ]);
      });
    });

    describe('Nested property access', () => {
      it('should interpolate nested object properties', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { email: '${user.email}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { user: { email: 'john@example.com', id: 123 } },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { email: 'john@example.com' },
          },
        ]);
      });

      it('should interpolate deeply nested properties', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { groupName: '${user.groups[0].name}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          {
            user: {
              groups: [{ name: 'Admin', id: 1 }],
            },
          },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { groupName: 'Admin' },
          },
        ]);
      });
    });

    describe('Helper functions', () => {
      it('should call helper function and use result', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: '${getGroupIds(user.groups)}' } },
          },
        ];

        const helpers = {
          getGroupIds: (groups: Array<{ id: number }>) =>
            groups.map((g) => g.id),
        };

        const result = materializer.materialize(
          rules,
          { user: { groups: [{ id: 1 }, { id: 5 }, { id: 8 }] } },
          helpers,
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: [1, 5, 8] } },
          },
        ]);
      });

      it('should call helper with multiple arguments', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { active: '${checkStatus(user.status, "active")}' },
          },
        ];

        const helpers = {
          checkStatus: (status: string, expected: string) => status === expected,
        };

        const result = materializer.materialize(
          rules,
          { user: { status: 'active' } },
          helpers,
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { active: true },
          },
        ]);
      });
    });

    describe('@input variable (external data)', () => {
      it('should interpolate @input variable', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: '${@input.userId}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          {},
          {},
          { userId: 456 },
        );

        expect(result).toEqual([
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: 456 },
          },
        ]);
      });

      it('should use @input with helper functions', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: '${getValProps(@input.groups, "id")}' } },
          },
        ];

        const helpers = {
          getValProps: (arr: any[], prop: string) =>
            arr.map((item) => item[prop]),
        };

        const result = materializer.materialize(
          rules,
          {},
          helpers,
          { groups: [{ id: 1, name: 'A' }, { id: 5, name: 'B' }] },
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { groupIds: { $in: [1, 5] } },
          },
        ]);
      });

      it('should combine context and @input variables', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'patchOne',
            subject: 'Post',
            conditions: {
              authorId: '${currentUserId}',
              postId: '${@input.id}',
            },
          },
        ];

        const result = materializer.materialize(
          rules,
          { currentUserId: 123 },
          {},
          { id: 789 },
        );

        expect(result).toEqual([
          {
            action: 'patchOne',
            subject: 'Post',
            conditions: {
              authorId: 123,
              postId: 789,
            },
          },
        ]);
      });
    });

    describe('Special characters and escaping', () => {
      it('should handle strings with quotes', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { name: '${userName}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userName: 'O\'Brien' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { name: 'O\'Brien' },
          },
        ]);
      });

      it('should handle strings with double quotes', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { description: '${desc}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { desc: 'Said "hello" loudly' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { description: 'Said "hello" loudly' },
          },
        ]);
      });

      it('should handle strings with backslashes', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'File',
            conditions: { path: '${filePath}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { filePath: 'C:\\temp\\file.txt' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'File',
            conditions: { path: 'C:\\temp\\file.txt' },
          },
        ]);
      });

      it('should handle strings with newlines and tabs', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Text',
            conditions: { content: '${text}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { text: 'Line 1\nLine 2\tTabbed' },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Text',
            conditions: { content: 'Line 1\nLine 2\tTabbed' },
          },
        ]);
      });
    });

    describe('Multiple rules and conditions', () => {
      it('should materialize multiple rules', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { id: '${userId}' },
          },
          {
            action: 'patchOne',
            subject: 'Post',
            conditions: { authorId: '${userId}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userId: 123 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { id: 123 },
          },
          {
            action: 'patchOne',
            subject: 'Post',
            conditions: { authorId: 123 },
          },
        ]);
      });

      it('should materialize rules with multiple conditions', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: {
              authorId: '${userId}',
              published: '${isPublished}',
              groupIds: { $in: '${groupIds}' },
            },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userId: 123, isPublished: true, groupIds: [1, 5, 8] },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: {
              authorId: 123,
              published: true,
              groupIds: { $in: [1, 5, 8] },
            },
          },
        ]);
      });

      it('should materialize rules with fields', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: '${userId}' },
            fields: ['name', 'email'],
          },
        ];

        const result = materializer.materialize(
          rules,
          { userId: 123 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'patchOne',
            subject: 'User',
            conditions: { id: 123 },
            fields: ['name', 'email'],
          },
        ]);
      });

      it('should preserve inverted and reason fields', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'deleteOne',
            subject: 'Post',
            conditions: { id: '${postId}' },
            inverted: true,
            reason: 'Cannot delete this post',
          },
        ];

        const result = materializer.materialize(
          rules,
          { postId: 789 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'deleteOne',
            subject: 'Post',
            conditions: { id: 789 },
            inverted: true,
            reason: 'Cannot delete this post',
          },
        ]);
      });
    });

    describe('MongoDB operators', () => {
      it('should work with $in operator', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { status: { $in: '${statuses}' } },
          },
        ];

        const result = materializer.materialize(
          rules,
          { statuses: ['published', 'draft'] },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { status: { $in: ['published', 'draft'] } },
          },
        ]);
      });

      it('should work with $gt operator', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { views: { $gt: '${minViews}' } },
          },
        ];

        const result = materializer.materialize(
          rules,
          { minViews: 100 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: { views: { $gt: 100 } },
          },
        ]);
      });

      it('should work with complex nested conditions', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'Post',
            conditions: {
              $or: [
                { authorId: '${userId}' },
                { collaborators: { $in: '${userId}' } },
              ],
            },
          },
        ];

        const result = materializer.materialize(
          rules,
          { userId: 123 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'Post',
            conditions: {
              $or: [
                { authorId: 123 },
                { collaborators: { $in: 123 } },
              ],
            },
          },
        ]);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty rules array', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [];

        const result = materializer.materialize(rules, {}, {});

        expect(result).toEqual([]);
      });

      it('should handle rules without conditions', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
          },
        ];

        const result = materializer.materialize(rules, {}, {});

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
          },
        ]);
      });

      it('should handle rules without template variables', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { active: true },
          },
        ];

        const result = materializer.materialize(rules, {}, {});

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { active: true },
          },
        ]);
      });

      it('should handle empty @input', () => {
        const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
          {
            action: 'getAll',
            subject: 'User',
            conditions: { userId: '${currentUserId}' },
          },
        ];

        const result = materializer.materialize(
          rules,
          { currentUserId: 123 },
          {},
        );

        expect(result).toEqual([
          {
            action: 'getAll',
            subject: 'User',
            conditions: { userId: 123 },
          },
        ]);
      });
    });
  });

  describe('Strict mode', () => {
    let materializer: RuleMaterializer;

    beforeEach(async () => {
      const { unit } = await TestBed.solitary(RuleMaterializer)
        .mock(ACL_MODULE_OPTIONS)
        .impl(() => ({
          strictInterpolation: true,
        }))
        .compile();
      materializer = unit;
    });

    it('should throw error for missing variable in strict mode', () => {
      const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
        {
          action: 'getAll',
          subject: 'User',
          conditions: { id: '${nonExistent}' },
        },
      ];

      expect(() => {
        materializer.materialize(rules, {}, {});
      }).toThrow();
    });

    it('should throw error for undefined @input property', () => {
      const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
        {
          action: 'getAll',
          subject: 'User',
          conditions: { id: '${@input.nonExistent}' },
        },
      ];

      expect(() => {
        materializer.materialize(rules, {}, {}, {});
      }).toThrow();
    });

    it('should successfully materialize when all variables exist', () => {
      const rules: RawRuleFrom<AbilityTuple, MongoQuery>[] = [
        {
          action: 'getAll',
          subject: 'User',
          conditions: { id: '${userId}' },
        },
      ];

      const result = materializer.materialize(
        rules,
        { userId: 123 },
        {},
      );

      expect(result).toEqual([
        {
          action: 'getAll',
          subject: 'User',
          conditions: { id: 123 },
        },
      ]);
    });
  });
});




