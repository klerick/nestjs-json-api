import 'reflect-metadata';

import {
  JsonApiReadOnly,
  getJsonApiReadOnlyFields,
  JsonApiImmutable,
  getJsonApiImmutableFields,
} from './json-api-read-only.decorator';
import {
  JSON_API_DECORATOR_READ_ONLY,
  JSON_API_DECORATOR_IMMUTABLE,
} from '../../../../constants';

describe('JsonApiReadOnly decorator', () => {
  it('should save property key in metadata', () => {
    class TestEntity {
      @JsonApiReadOnly()
      createdAt!: Date;
    }

    const keys = Reflect.getMetadata(JSON_API_DECORATOR_READ_ONLY, TestEntity);
    expect(keys).toContain('createdAt');
  });

  it('should save multiple property keys', () => {
    class TestEntity {
      @JsonApiReadOnly()
      createdAt!: Date;

      @JsonApiReadOnly()
      updatedAt!: Date;

      normalField!: string;
    }

    const keys = Reflect.getMetadata(JSON_API_DECORATOR_READ_ONLY, TestEntity);
    expect(keys).toContain('createdAt');
    expect(keys).toContain('updatedAt');
    expect(keys).not.toContain('normalField');
    expect(keys).toHaveLength(2);
  });

  it('should return empty array when no read-only fields', () => {
    class TestEntity {
      normalField!: string;
    }

    const fields = getJsonApiReadOnlyFields(TestEntity);
    expect(fields).toEqual([]);
  });

  it('should return read-only fields via getJsonApiReadOnlyFields', () => {
    class TestEntity {
      @JsonApiReadOnly()
      createdAt!: Date;

      @JsonApiReadOnly()
      computedField!: number;
    }

    const fields = getJsonApiReadOnlyFields(TestEntity);
    expect(fields).toContain('createdAt');
    expect(fields).toContain('computedField');
    expect(fields).toHaveLength(2);
  });

  describe('inheritance', () => {
    it('should collect read-only fields from base class', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;

        @JsonApiReadOnly()
        updatedAt!: Date;
      }

      class ChildEntity extends BaseEntity {
        name!: string;
      }

      const fields = getJsonApiReadOnlyFields(ChildEntity);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('updatedAt');
      expect(fields).toHaveLength(2);
    });

    it('should collect read-only fields from both base and child class', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;
      }

      class ChildEntity extends BaseEntity {
        @JsonApiReadOnly()
        computedField!: number;

        name!: string;
      }

      const fields = getJsonApiReadOnlyFields(ChildEntity);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('computedField');
      expect(fields).toHaveLength(2);
    });

    it('should collect read-only fields from deep inheritance chain', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;
      }

      class MiddleEntity extends BaseEntity {
        @JsonApiReadOnly()
        updatedAt!: Date;
      }

      class ChildEntity extends MiddleEntity {
        @JsonApiReadOnly()
        computedField!: number;
      }

      const fields = getJsonApiReadOnlyFields(ChildEntity);
      expect(fields).toContain('createdAt');
      expect(fields).toContain('updatedAt');
      expect(fields).toContain('computedField');
      expect(fields).toHaveLength(3);
    });

    it('should not duplicate fields when same field decorated in child', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;
      }

      class ChildEntity extends BaseEntity {
        @JsonApiReadOnly()
        override createdAt!: Date;
      }

      const fields = getJsonApiReadOnlyFields(ChildEntity);
      expect(fields).toContain('createdAt');
      expect(fields).toHaveLength(1);
    });

    it('should not affect sibling classes', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;
      }

      class ChildA extends BaseEntity {
        @JsonApiReadOnly()
        fieldA!: string;
      }

      class ChildB extends BaseEntity {
        @JsonApiReadOnly()
        fieldB!: string;
      }

      const fieldsA = getJsonApiReadOnlyFields(ChildA);
      const fieldsB = getJsonApiReadOnlyFields(ChildB);

      expect(fieldsA).toContain('createdAt');
      expect(fieldsA).toContain('fieldA');
      expect(fieldsA).not.toContain('fieldB');

      expect(fieldsB).toContain('createdAt');
      expect(fieldsB).toContain('fieldB');
      expect(fieldsB).not.toContain('fieldA');
    });
  });
});

describe('JsonApiImmutable decorator', () => {
  it('should save property key in metadata', () => {
    class TestEntity {
      @JsonApiImmutable()
      score!: number;
    }

    const keys = Reflect.getMetadata(JSON_API_DECORATOR_IMMUTABLE, TestEntity);
    expect(keys).toContain('score');
  });

  it('should save multiple property keys', () => {
    class TestEntity {
      @JsonApiImmutable()
      score!: number;

      @JsonApiImmutable()
      rating!: number;

      normalField!: string;
    }

    const keys = Reflect.getMetadata(JSON_API_DECORATOR_IMMUTABLE, TestEntity);
    expect(keys).toContain('score');
    expect(keys).toContain('rating');
    expect(keys).not.toContain('normalField');
    expect(keys).toHaveLength(2);
  });

  it('should return empty array when no immutable fields', () => {
    class TestEntity {
      normalField!: string;
    }

    const fields = getJsonApiImmutableFields(TestEntity);
    expect(fields).toEqual([]);
  });

  it('should return immutable fields via getJsonApiImmutableFields', () => {
    class TestEntity {
      @JsonApiImmutable()
      score!: number;

      @JsonApiImmutable()
      priority!: number;
    }

    const fields = getJsonApiImmutableFields(TestEntity);
    expect(fields).toContain('score');
    expect(fields).toContain('priority');
    expect(fields).toHaveLength(2);
  });

  describe('inheritance', () => {
    it('should collect immutable fields from base class', () => {
      class BaseEntity {
        @JsonApiImmutable()
        score!: number;
      }

      class ChildEntity extends BaseEntity {
        name!: string;
      }

      const fields = getJsonApiImmutableFields(ChildEntity);
      expect(fields).toContain('score');
      expect(fields).toHaveLength(1);
    });

    it('should collect immutable fields from both base and child class', () => {
      class BaseEntity {
        @JsonApiImmutable()
        score!: number;
      }

      class ChildEntity extends BaseEntity {
        @JsonApiImmutable()
        priority!: number;

        name!: string;
      }

      const fields = getJsonApiImmutableFields(ChildEntity);
      expect(fields).toContain('score');
      expect(fields).toContain('priority');
      expect(fields).toHaveLength(2);
    });

    it('should collect immutable fields from deep inheritance chain', () => {
      class BaseEntity {
        @JsonApiImmutable()
        score!: number;
      }

      class MiddleEntity extends BaseEntity {
        @JsonApiImmutable()
        rating!: number;
      }

      class ChildEntity extends MiddleEntity {
        @JsonApiImmutable()
        priority!: number;
      }

      const fields = getJsonApiImmutableFields(ChildEntity);
      expect(fields).toContain('score');
      expect(fields).toContain('rating');
      expect(fields).toContain('priority');
      expect(fields).toHaveLength(3);
    });

    it('should not duplicate fields when same field decorated in child', () => {
      class BaseEntity {
        @JsonApiImmutable()
        score!: number;
      }

      class ChildEntity extends BaseEntity {
        @JsonApiImmutable()
        override score!: number;
      }

      const fields = getJsonApiImmutableFields(ChildEntity);
      expect(fields).toContain('score');
      expect(fields).toHaveLength(1);
    });
  });

  describe('combination with JsonApiReadOnly', () => {
    it('should track read-only and immutable fields separately', () => {
      class TestEntity {
        @JsonApiReadOnly()
        createdAt!: Date;

        @JsonApiImmutable()
        score!: number;

        normalField!: string;
      }

      const readOnlyFields = getJsonApiReadOnlyFields(TestEntity);
      const immutableFields = getJsonApiImmutableFields(TestEntity);

      expect(readOnlyFields).toContain('createdAt');
      expect(readOnlyFields).not.toContain('score');
      expect(readOnlyFields).toHaveLength(1);

      expect(immutableFields).toContain('score');
      expect(immutableFields).not.toContain('createdAt');
      expect(immutableFields).toHaveLength(1);
    });

    it('should work with inheritance and both decorators', () => {
      class BaseEntity {
        @JsonApiReadOnly()
        createdAt!: Date;

        @JsonApiImmutable()
        baseScore!: number;
      }

      class ChildEntity extends BaseEntity {
        @JsonApiReadOnly()
        computedField!: number;

        @JsonApiImmutable()
        childScore!: number;
      }

      const readOnlyFields = getJsonApiReadOnlyFields(ChildEntity);
      const immutableFields = getJsonApiImmutableFields(ChildEntity);

      expect(readOnlyFields).toContain('createdAt');
      expect(readOnlyFields).toContain('computedField');
      expect(readOnlyFields).toHaveLength(2);

      expect(immutableFields).toContain('baseScore');
      expect(immutableFields).toContain('childScore');
      expect(immutableFields).toHaveLength(2);
    });
  });
});