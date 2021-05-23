import { EntityMetadata } from 'typeorm';

import { checkResourceRelationsType } from './check-resource-relations-type';
import { RequestResourceData } from '../../../types';


describe('CheckResourceRelationsType', () => {
  it('should return no errors if correct data', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-one',
        propertyName: 'test',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should return error relation does not exist', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-one',
        propertyName: 'another',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data/relationships');
    expect(result[0].detail).toContain("'test'");
    expect(result).toHaveLength(1);
  });

  it('should return error if many-to-one and data is array', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: [{
            type: 'relation',
            id: '1',
          }]
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'many-to-one',
        propertyName: 'test',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data/relationships/test/data');
    expect(result[0].detail).toContain("'test'");
    expect(result).toHaveLength(1);
  });

  it('should return error if one-to-one and data is array', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: [{
            type: 'relation',
            id: '1',
          }]
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-one',
        propertyName: 'test',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data/relationships/test/data');
    expect(result[0].detail).toContain("'test'");
    expect(result).toHaveLength(1);
  });

  it('should return error if many-to-many and data is object', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'many-to-many',
        propertyName: 'test',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data/relationships/test/data');
    expect(result[0].detail).toContain("'test'");
    expect(result).toHaveLength(1);
  });

  it('should return error if one-to-many relation', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-many',
        propertyName: 'test',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data/relationships/test');
    expect(result[0].detail).toContain("'test'");
    expect(result).toHaveLength(1);
  });

  it('should return errors for each relation', async () => {
    const attributesMock = {
      relationships: {
        first: {
          data: {
            type: 'relation',
            id: '1',
          }
        },
        second: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-many',
        propertyName: 'first',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );

    expect(result).toHaveLength(2);
  });

  it('should return errors for each relation', async () => {
    const attributesMock = {
      relationships: {
        first: {
          data: {
            type: 'relation',
            id: '1',
          }
        },
        second: {
          data: {
            type: 'relation',
            id: '1',
          }
        }
      }
    } as undefined as RequestResourceData;
    const metadataMock = {
      relations: [{
        relationType: 'one-to-many',
        propertyName: 'first',
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsType(
      attributesMock,
      metadataMock,
    );

    expect(result).toHaveLength(2);
  });
});
