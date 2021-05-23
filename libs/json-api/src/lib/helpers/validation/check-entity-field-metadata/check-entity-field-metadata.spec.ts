import { EntityMetadata } from 'typeorm';

import { checkEntityFieldMetadata } from './check-entity-field-metadata';
import { QueryField, QueryParams } from '../../../types';


describe('CheckEntityFieldMetadata', () => {
  it('should return no errors on right field', async () => {
    const metadataMock = {
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      relations: [{
        propertyName: 'some-relation',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
    } as EntityMetadata;
    const paramsMock = {} as QueryParams;
    const result = await checkEntityFieldMetadata(
      'second-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result).toHaveLength(0);
  });

  it('should return no errors on right field with current entity and dot', async () => {
    const metadataMock = {
      name: 'test-entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      relations: [{
        propertyName: 'some-relation',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
    } as EntityMetadata;
    const paramsMock = {} as QueryParams;
    const result = await checkEntityFieldMetadata(
      'test-entity.second-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result).toHaveLength(0);
  });

  it('should use entity name transform to right case', async () => {
    const metadataMock = {
      name: 'testEntity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      relations: [{
        propertyName: 'some-relation',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
    } as EntityMetadata;
    const paramsMock = {} as QueryParams;
    const result = await checkEntityFieldMetadata(
      'test-entity.second-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result).toHaveLength(0);
  });

  it('should return error if field does not exist', async () => {
    const metadataMock = {
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      relations: [{
        propertyName: 'some-relation',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
    } as EntityMetadata;
    const paramsMock = {} as QueryParams;
    const result = await checkEntityFieldMetadata(
      'wrong-field',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );

    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'wrong-field'");
    expect(result).toHaveLength(1);
  });

  it('should return error if field has incorrect format', async () => {
    const metadataMock = {
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      relations: [{
        propertyName: 'some-relation',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
    } as EntityMetadata;
    const paramsMock = {} as QueryParams;
    const result = await checkEntityFieldMetadata(
      'wrong-field.test.test',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );

    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'wrong-field.test.test'");
    expect(result).toHaveLength(1);
  });

  it('should return no errors on right relation field', async () => {
    const metadataMock = {
      name: 'entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
      relations: [{
        propertyPath: 'relation',
        inverseEntityMetadata: {
          primaryColumns: [{
            propertyPath: 'third-column'
          }],
          columns: [{
            propertyPath: 'second-column'
          }]
        }
      }]
    } as EntityMetadata;
    const paramsMock = {
      'include': [
        'relation',
      ],
    } as QueryParams;
    const result = await checkEntityFieldMetadata(
      'relation.third-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result).toHaveLength(0);
  });

  it('should return errors if relation does not exist', async () => {
    const metadataMock = {
      name: 'entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
      relations: [{
        propertyPath: 'relation',
        inverseEntityMetadata: {
          primaryColumns: [{
            propertyPath: 'third-column'
          }]
        }
      }]
    } as EntityMetadata;
    const paramsMock = {
      'include': [
        'relation',
      ],
    } as QueryParams;
    const result = await checkEntityFieldMetadata(
      'wrong-relation.third-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'wrong-relation'");
    expect(result).toHaveLength(1);
  });

  it('should return errors if relation does not included', async () => {
    const metadataMock = {
      name: 'entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
      relations: [{
        propertyPath: 'relation',
        inverseEntityMetadata: {
          primaryColumns: [{
            propertyPath: 'third-column'
          }]
        }
      }]
    } as EntityMetadata;
    const paramsMock = {
      'include': [],
    } as QueryParams;
    const result = await checkEntityFieldMetadata(
      'relation.third-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'relation'");
    expect(result).toHaveLength(1);
  });

  it('should return errors if relation does not have field', async () => {
    const metadataMock = {
      name: 'entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
      relations: [{
        propertyPath: 'relation',
        inverseEntityMetadata: {
          primaryColumns: [{
            propertyPath: 'third-column'
          }],
          columns: [{
            propertyPath: 'second-column'
          }]
        }
      }]
    } as EntityMetadata;
    const paramsMock = {
      'include': [
        'relation'
      ],
    } as QueryParams;
    const result = await checkEntityFieldMetadata(
      'relation.wrong-column',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'wrong-column'");
    expect(result).toHaveLength(1);
  });

  it('should throw an error on existance relation check without include', async () => {
    const metadataMock = {
      name: 'entity',
      primaryColumns: [{
        propertyPath: 'primary-column',
      }],
      columns: [{
        propertyPath: 'second-column'
      }],
      relations: [{
        propertyPath: 'relation',
        inverseEntityMetadata: {
          primaryColumns: [{
            propertyPath: 'third-column'
          }],
          columns: [{
            propertyPath: 'second-column'
          }]
        }
      }]
    } as EntityMetadata;
    const paramsMock = {
      'include': [],
    } as QueryParams;
    const result = await checkEntityFieldMetadata(
      'relation',
      paramsMock,
      metadataMock,
      QueryField.filter,
    );
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'include'");
    expect(result).toHaveLength(1);
  });
});
