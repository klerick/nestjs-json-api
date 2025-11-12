import { describe, it, expect } from 'vitest';
import { mergeQueryWithAclData } from './merge-query-with-acl-data';

describe('mergeQueryWithAclData', () => {
  describe('basic cases', () => {
    it('should return unchanged query if no ACL data provided', () => {
      const query = {
        fields: { target: ['id', 'login'] },
        include: ['profile'],
      } as any;

      const result = mergeQueryWithAclData(query, null, []);

      expect(result.fields).toEqual(query.fields);
      expect(result.include).toEqual(query.include);
    });

    it('should merge target fields without duplicates', () => {
      const query = {
        fields: { target: ['id', 'login'] },
        include: [],
      } as any;

      const aclFields = { target: ['login', 'email'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields?.target).toEqual(['id', 'login', 'email']);
    });

    it('should merge relation fields without duplicates', () => {
      const query = {
        fields: {
          target: ['id'],
          profile: ['id', 'name'],
        },
        include: ['profile'],
      } as any;

      const aclFields = { profile: ['name', 'isPublic'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      // @ts-ignore
      expect(result.fields?.profile).toEqual(['id', 'name', 'isPublic']);
    });

    it('should merge includes without duplicates', () => {
      const query = {
        fields: { target: ['id'] },
        include: ['profile', 'comments'],
      } as any;

      const aclInclude = ['comments', 'roles'];

      const result = mergeQueryWithAclData(query, null, aclInclude as any);

      expect(result.include).toEqual(['profile', 'comments', 'roles']);
    });
  });

  describe('fields: null cases (select ALL fields)', () => {
    it('should NOT add ACL fields when query.fields is null', () => {
      const query = {
        fields: null,
        include: [],
      } as any;

      const aclFields = { target: ['role'], profile: ['isPublic'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      // fields should remain null (all fields already selected)
      expect(result.fields).toBeNull();
    });

    it('should merge includes even when fields is null', () => {
      const query = {
        fields: null,
        include: ['profile'],
      } as any;

      const aclFields = { target: ['role'] };
      const aclInclude = ['comments'];

      const result = mergeQueryWithAclData(query, aclFields as any, aclInclude as any);

      expect(result.fields).toBeNull();
      expect(result.include).toEqual(['profile', 'comments']);
    });
  });

  describe('fields: undefined cases (select ALL fields)', () => {
    it('should NOT add ACL fields when query.fields is undefined', () => {
      const query = {
        include: [],
      } as any;

      const aclFields = { target: ['role'], profile: ['isPublic'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields).toBeUndefined();
    });
  });

  describe('fields: {} cases (empty object = ALL fields)', () => {
    it('should NOT add ACL fields when query.fields is empty object', () => {
      const query = {
        fields: {},
        include: [],
      } as any;

      const aclFields = { target: ['role'], profile: ['isPublic'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields).toEqual({});
    });
  });

  describe('missing relation key cases (relation not in query.fields = ALL fields for that relation)', () => {
    it('should NOT add ACL fields for missing relation key', () => {
      const query = {
        fields: { target: ['id'] },
        include: ['profile'],
      } as any;

      const aclFields = { profile: ['isPublic'] }; // profile not in query.fields

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields).toEqual({
        target: ['id'],
        // profile should NOT be added (missing key = all fields)
      });
    });

    it('should add ACL fields to target but NOT to missing relations', () => {
      const query = {
        fields: { target: ['id'] },
        include: ['profile'],
      } as any;

      const aclFields = { target: ['role'], comments: ['id'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields?.target).toEqual(['id', 'role']);
      // @ts-ignore
      expect(result.fields?.comments).toBeUndefined(); // NOT added
    });
  });

  describe('relation: null cases (specific relation = ALL fields)', () => {
    it('should NOT add ACL fields when relation is null', () => {
      const query = {
        fields: {
          target: ['id'],
          profile: null, // ALL fields for profile
        },
        include: ['profile'],
      } as any;

      const aclFields = { target: ['role'], profile: ['isPublic'] };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields?.target).toEqual(['id', 'role']);
      // @ts-ignore
      expect(result.fields?.profile).toBeNull(); // unchanged
    });
  });

  describe('complex scenarios', () => {
    it('should merge both fields and includes correctly', () => {
      const query = {
        fields: { target: ['id'], profile: ['phone'] },
        include: ['profile'],
      } as any;

      const aclFields = { target: ['role'], profile: ['isPublic'] };
      const aclInclude = ['comments'];

      const result = mergeQueryWithAclData(query, aclFields as any, aclInclude as any);

      expect(result.fields?.target).toEqual(['id', 'role']);
      // @ts-ignore
      expect(result.fields?.profile).toEqual(['phone', 'isPublic']);
      expect(result.include).toEqual(['profile', 'comments']);
    });

    it('should handle mix of defined and undefined relation keys', () => {
      const query = {
        fields: {
          target: ['id', 'login'],
          profile: ['phone'],
          // comments missing = all fields
        },
        include: ['profile', 'comments'],
      } as any;

      const aclFields = {
        target: ['role'],
        profile: ['isPublic'],
        comments: ['text'], // should NOT be added (missing in query)
      };

      const result = mergeQueryWithAclData(query, aclFields as any, []);

      expect(result.fields?.target).toEqual(['id', 'login', 'role']);
      // @ts-ignore
      expect(result.fields?.profile).toEqual(['phone', 'isPublic']);
      // @ts-ignore
      expect(result.fields?.comments).toBeUndefined(); // NOT added
    });
  });
});