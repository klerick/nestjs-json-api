import { describe, it, expect, beforeEach } from 'vitest';
import { removeAclAddedFields } from './remove-acl-added-fields';

describe('removeAclAddedFields', () => {
  let item: any;

  beforeEach(() => {
    item = {
      id: 1,
      login: 'user1',
      email: 'user@example.com',
      role: 'admin',
      profile: {
        id: 10,
        phone: '123456',
        isPublic: true,
      },
      comments: [{ id: 1, text: 'Comment 1' }],
    };
  });

  describe('basic cases', () => {
    it('should do nothing if no ACL fields provided', () => {
      const originalItem = JSON.parse(JSON.stringify(item));

      removeAclAddedFields(item, { target: ['id'] } as any, null);

      expect(item).toEqual(originalItem);
    });

    it('should remove target fields added by ACL', () => {
      const userFields = { target: ['id', 'login'] };
      const aclFields = { target: ['role', 'email'] };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item).toEqual({
        id: 1,
        login: 'user1',
        profile: {
          id: 10,
          phone: '123456',
          isPublic: true,
        },
        comments: [{ id: 1, text: 'Comment 1' }],
      });
      expect(item.email).toBeUndefined();
      expect(item.role).toBeUndefined();
    });

    it('should remove specific relation fields added by ACL', () => {
      const userFields = {
        target: ['id'],
        profile: ['id', 'phone'],
      };
      const aclFields = {
        profile: ['phone', 'isPublic'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item.profile).toEqual({
        id: 10,
        phone: '123456',
      });
      expect(item.profile.isPublic).toBeUndefined();
    });

    it('should keep fields that were requested by user', () => {
      const userFields = {
        target: ['id', 'login', 'role'],
      };
      const aclFields = {
        target: ['role', 'email'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item.id).toBe(1);
      expect(item.login).toBe('user1');
      expect(item.role).toBe('admin');
      expect(item.email).toBeUndefined();
    });

    it('should handle nested relation fields', () => {
      const userFields = {
        target: ['id'],
        profile: ['id'],
      };
      const aclFields = {
        target: ['role'],
        profile: ['id', 'phone', 'isPublic'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item.profile).toEqual({ id: 10 });
      expect(item.profile.phone).toBeUndefined();
      expect(item.profile.isPublic).toBeUndefined();
      expect(item.role).toBeUndefined();
    });
  });

  describe('userFields: null cases (all fields requested)', () => {
    it('should NOT remove anything when userFields is null', () => {
      const originalItem = JSON.parse(JSON.stringify(item));
      const aclFields = {
        target: ['role', 'email'],
        profile: ['isPublic'],
      };

      removeAclAddedFields(item, null, aclFields as any);

      // Nothing should be removed (null = all fields requested)
      expect(item).toEqual(originalItem);
      expect(item.role).toBe('admin');
      expect(item.email).toBe('user@example.com');
      expect(item.profile.isPublic).toBe(true);
    });
  });

  describe('userFields: undefined cases (all fields requested)', () => {
    it('should NOT remove anything when userFields is undefined', () => {
      const originalItem = JSON.parse(JSON.stringify(item));
      const aclFields = {
        target: ['role', 'email'],
        profile: ['isPublic'],
      };

      // @ts-ignore
      removeAclAddedFields(item, undefined, aclFields as any);

      // Nothing should be removed
      expect(item).toEqual(originalItem);
    });
  });

  describe('userFields: {} cases (empty object = all fields)', () => {
    it('should NOT remove anything when userFields is empty object', () => {
      const originalItem = JSON.parse(JSON.stringify(item));
      const aclFields = {
        target: ['role'],
        profile: ['isPublic'],
      };

      removeAclAddedFields(item, {} as any, aclFields as any);

      // Nothing should be removed
      expect(item).toEqual(originalItem);
    });
  });

  describe('missing relation key cases (all fields for that relation)', () => {
    it('should NOT remove relation when key is missing from userFields', () => {
      const userFields = {
        target: ['id', 'login'],
        // profile missing = all profile fields requested
      };
      const aclFields = {
        profile: ['isPublic'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      // profile should NOT be removed
      expect(item.profile).toBeDefined();
      expect(item.profile.isPublic).toBe(true);
      expect(item.id).toBe(1);
      expect(item.login).toBe('user1');
    });

    it('should handle mix of present and missing relation keys', () => {
      const userFields = {
        target: ['id'],
        profile: ['phone'],
        // comments missing = all comments fields requested
      };
      const aclFields = {
        target: ['role'],
        profile: ['isPublic'],
        comments: ['text'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      // role removed (target has array)
      expect(item.role).toBeUndefined();

      // profile.isPublic removed (profile has array)
      expect(item.profile).toEqual({ id: 10, phone: '123456' });

      // comments NOT removed (missing key = all fields)
      expect(item.comments).toEqual([{ id: 1, text: 'Comment 1' }]);
    });
  });

  describe('relation: null cases (all fields for that relation)', () => {
    it('should NOT remove fields when relation is null', () => {
      const userFields = {
        target: ['id'],
        profile: null as any, // all profile fields requested
      };
      const aclFields = {
        target: ['role'],
        profile: ['isPublic', 'phone'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      // role removed (target has array)
      expect(item.role).toBeUndefined();

      // profile fields NOT removed (profile: null)
      expect(item.profile).toEqual({
        id: 10,
        phone: '123456',
        isPublic: true,
      });
    });

    it('should handle mix of array and null relations', () => {
      const userFields = {
        target: ['id', 'login'],
        profile: null as any,
        comments: ['id'],
      };
      const aclFields = {
        target: ['role'],
        profile: ['isPublic'],
        comments: ['id', 'text'],
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      // role removed (target array, not requested)
      expect(item.role).toBeUndefined();

      // profile untouched (null)
      expect(item.profile).toEqual({
        id: 10,
        phone: '123456',
        isPublic: true,
      });

      // comments.text removed (array, not requested)
      expect(item.comments).toEqual([{ id: 1 }]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle all cases mixed together', () => {
      const userFields = {
        target: ['id', 'login'],      // array
        profile: null as any,         // null = all fields
        // comments missing            // undefined = all fields
      };
      const aclFields = {
        target: ['role', 'email'],    // should remove both
        profile: ['isPublic'],        // should NOT remove
        comments: ['text'],           // should NOT remove
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item).toEqual({
        id: 1,
        login: 'user1',
        // role, email removed (not in target array)
        profile: {
          id: 10,
          phone: '123456',
          isPublic: true,  // kept (profile: null)
        },
        comments: [{ id: 1, text: 'Comment 1' }],  // kept (missing key)
      });
    });

    it('should keep requested relations with their fields', () => {
      const userFields = {
        target: ['id'],
        profile: ['phone'],
        comments: ['text'],  // User requested only 'text'
      };
      const aclFields = {
        profile: ['isPublic'],
        comments: ['id'],     // ACL added 'id' for checks
      };

      removeAclAddedFields(item, userFields as any, aclFields as any);

      expect(item.profile).toEqual({
        id: 10,
        phone: '123456',
      });
      expect(item.profile.isPublic).toBeUndefined();
      // 'id' should be removed (not requested by user, added by ACL)
      expect(item.comments).toEqual([{ text: 'Comment 1' }]);
    });
  });

  describe('remove ACL-added relations via include', () => {
    it('should remove relation added by ACL include', () => {
      const userFields = null;  // All fields
      const userInclude: any[] = [];  // NO includes requested by user
      const aclInclude = ['profile'];  // ACL added profile for conditions check

      // @ts-ignore
      removeAclAddedFields(item, userFields, null, userInclude, aclInclude as any);

      // profile should be removed (not requested by user)
      expect(item.profile).toBeUndefined();
      expect(item.id).toBe(1);
      expect(item.login).toBe('user1');
    });

    it('should keep relation requested by user via include', () => {
      const userFields = null;
      const userInclude = ['profile'];  // User requested profile
      const aclInclude = ['profile', 'comments'];  // ACL added profile + comments

      removeAclAddedFields(item, userFields, null, userInclude as any, aclInclude as any);

      // profile should be kept (requested by user)
      expect(item.profile).toBeDefined();
      expect(item.profile.phone).toBe('123456');

      // comments should be removed (not requested by user)
      expect(item.comments).toBeUndefined();
    });

    it('should remove multiple ACL-added relations', () => {
      const userFields = null;
      const userInclude: any[] = [];
      const aclInclude = ['profile', 'comments'];

      // @ts-ignore
      removeAclAddedFields(item, userFields, null, userInclude, aclInclude as any);

      expect(item.profile).toBeUndefined();
      expect(item.comments).toBeUndefined();
      expect(item.id).toBe(1);
      expect(item.login).toBe('user1');
    });

    it('should work with fields and includes together', () => {
      const userFields = { target: ['id'] };
      const aclFields = { target: ['role'], profile: ['isPublic'] };
      const userInclude: any[] = [];  // NO includes
      const aclInclude = ['profile'];  // ACL added profile

      // @ts-ignore
      removeAclAddedFields(item, userFields as any, aclFields as any, userInclude, aclInclude as any);

      // role removed (field-level)
      expect(item.role).toBeUndefined();

      // profile removed entirely (relation-level)
      expect(item.profile).toBeUndefined();

      expect(item.id).toBe(1);
      expect(item.login).toBe('user1');
    });

    it('should handle undefined userInclude as empty array', () => {
      const userFields = null;
      const aclInclude = ['profile'];

      removeAclAddedFields(item, userFields, null, undefined, aclInclude as any);

      // profile should be removed (userInclude undefined = [])
      expect(item.profile).toBeUndefined();
    });
  });
});