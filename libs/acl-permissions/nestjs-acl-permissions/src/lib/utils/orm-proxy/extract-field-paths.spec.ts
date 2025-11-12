import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExtractFieldPaths } from './extract-field-paths';

describe('ExtractFieldPaths', () => {
  let extractor: ExtractFieldPaths;
  let entityParamMap: Map<any, any>;

  // Mock entity classes
  class User {
    id?: number;
    login?: string;
    email?: string;
    profile?: Profile;
    comments?: Comment[];
  }

  class Profile {
    id?: number;
    phone?: string;
    address?: Address;
  }

  class Address {
    id?: number;
    city?: string;
    street?: string;
  }

  class Comment {
    id?: number;
    text?: string;
  }

  beforeEach(() => {
    // Reset singleton
    (ExtractFieldPaths as any).instance = undefined;

    // Create mock EntityParamMap
    entityParamMap = new Map();

    // User metadata
    entityParamMap.set(User, {
      props: ['id', 'login', 'email'],
      primaryColumnName: 'id',
      relations: ['profile', 'comments'],
      relationProperty: {
        profile: {
          entityClass: Profile,
        },
        comments: {
          entityClass: Comment,
        },
      },
    });

    // Profile metadata
    entityParamMap.set(Profile, {
      props: ['id', 'phone'],
      primaryColumnName: 'id',
      relations: ['address'],
      relationProperty: {
        address: {
          entityClass: Address,
        },
      },
    });

    // Address metadata
    entityParamMap.set(Address, {
      props: ['id', 'city', 'street'],
      primaryColumnName: 'id',
      relations: [],
      relationProperty: {},
    });

    // Comment metadata
    entityParamMap.set(Comment, {
      props: ['id', 'text'],
      primaryColumnName: 'id',
      relations: [],
      relationProperty: {},
    });

    extractor = ExtractFieldPaths.getInstance(entityParamMap as any);
  });

  afterEach(() => {
    // Clean up singleton
    (ExtractFieldPaths as any).instance = undefined;
  });

  it('should extract simple fields', () => {
    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.email = 'user@example.com';

    const fields = extractor.fields(user, User);

    // id is primary key, should be skipped
    expect(fields).toEqual(['login', 'email']);
  });

  it('should extract fields with one-to-one relation', () => {
    const profile = new Profile();
    profile.id = 10;
    profile.phone = '123456';

    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.profile = profile;

    const fields = extractor.fields(user, User);

    // id and profile.id are primary keys, should be skipped
    expect(fields).not.toContain('id');
    expect(fields).toContain('login');
    expect(fields).not.toContain('profile.id');
    expect(fields).toContain('profile.phone');
    expect(fields).toEqual(['login', 'profile.phone']);
  });

  it('should extract fields with one-to-many relation', () => {
    const comment1 = new Comment();
    comment1.id = 1;
    comment1.text = 'Comment 1';

    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.comments = [comment1];

    const fields = extractor.fields(user, User);

    // id and comments.id are primary keys, should be skipped
    expect(fields).not.toContain('id');
    expect(fields).toContain('login');
    expect(fields).not.toContain('comments.id');
    expect(fields).toContain('comments.text');
    expect(fields).toEqual(['login', 'comments.text']);
  });

  it('should extract nested relation fields', () => {
    const address = new Address();
    address.id = 100;
    address.city = 'New York';
    address.street = 'Main St';

    const profile = new Profile();
    profile.id = 10;
    profile.phone = '123456';
    profile.address = address;

    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.profile = profile;

    const fields = extractor.fields(user, User);

    // All id fields are primary keys, should be skipped
    expect(fields).not.toContain('id');
    expect(fields).toContain('login');
    expect(fields).not.toContain('profile.id');
    expect(fields).toContain('profile.phone');
    expect(fields).not.toContain('profile.address.id');
    expect(fields).toContain('profile.address.city');
    expect(fields).toContain('profile.address.street');
    expect(fields).toEqual(['login', 'profile.phone', 'profile.address.city', 'profile.address.street']);
  });

  it('should skip null relation', () => {
    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.profile = null as any;

    const fields = extractor.fields(user, User);

    // id is primary key, should be skipped
    expect(fields).toEqual(['login']);
    expect(fields).not.toContain('profile.id');
  });

  it('should skip undefined relation', () => {
    const user = new User();
    user.id = 1;
    user.login = 'user1';

    const fields = extractor.fields(user, User);

    // id is primary key, should be skipped
    expect(fields).toEqual(['login']);
  });

  it('should skip empty array relation', () => {
    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.comments = [];

    const fields = extractor.fields(user, User);

    // id is primary key, should be skipped
    expect(fields).toEqual(['login']);
  });

  it('should skip fields not present in object', () => {
    const user = new User();
    user.id = 1;
    // login and email not set

    const fields = extractor.fields(user, User);

    // id is primary key, but it's not in the object (not set explicitly after construction)
    // Actually, we set it, so it IS in the object
    // But it should be skipped as primary key, so result should be []
    expect(fields).toEqual([]);
    expect(fields).not.toContain('id');
    expect(fields).not.toContain('login');
    expect(fields).not.toContain('email');
  });

  it('should throw error if entity not found in EntityParamMap', () => {
    class UnknownEntity {
      id?: number;
    }

    const obj = new UnknownEntity();
    obj.id = 1;

    expect(() => extractor.fields(obj, UnknownEntity)).toThrow('Entity UnknownEntity not found in EntityParamMap');
  });

  it('should return singleton instance', () => {
    const instance1 = ExtractFieldPaths.getInstance(entityParamMap as any);
    const instance2 = ExtractFieldPaths.getInstance(entityParamMap as any);

    expect(instance1).toBe(instance2);
  });

  it('should handle complex nested structure', () => {
    const address = new Address();
    address.id = 100;
    address.city = 'New York';

    const profile = new Profile();
    profile.id = 10;
    profile.address = address;

    const comment1 = new Comment();
    comment1.id = 1;
    comment1.text = 'Comment';

    const user = new User();
    user.id = 1;
    user.login = 'user1';
    user.email = 'user@example.com';
    user.profile = profile;
    user.comments = [comment1];

    const fields = extractor.fields(user, User);

    // All id fields are primary keys, should be skipped
    expect(fields).not.toContain('id');
    expect(fields).toContain('login');
    expect(fields).toContain('email');
    expect(fields).not.toContain('profile.id');
    expect(fields).not.toContain('profile.address.id');
    expect(fields).toContain('profile.address.city');
    expect(fields).not.toContain('comments.id');
    expect(fields).toContain('comments.text');
    // Only 4 non-primary-key fields
    expect(fields).toEqual(['login', 'email', 'profile.address.city', 'comments.text']);
    expect(fields.length).toBe(4);
  });
});