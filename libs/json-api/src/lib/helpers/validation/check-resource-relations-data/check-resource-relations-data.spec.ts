import { EntityMetadata } from 'typeorm';

import { checkResourceRelationsData } from './check-resource-relations-data';
import { RequestResourceData } from '../../../types';


describe('CheckResourceRelationsData', () => {
  it('should return no errors if correct data', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation-type',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should return no errors if data not required', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: null
        }
      },
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
      false,
    );
    expect(result).toHaveLength(0);
  });

  it('should return error if data nullable', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: undefined
        }
      }

    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/relationships/test');
    expect(result[0].detail).toContain("'data'");
    expect(result).toHaveLength(1);
  });

  it('should return error if id and type not passed', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: undefined,
            id: undefined,
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );


    expect(result[0].source.pointer).toBe('/data/relationships/test/data');
    expect(result[1].source.pointer).toBe('/data/relationships/test/data');
    expect(
      result.find(error => {
        return error.detail.includes("'id'");
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return error.detail.includes("'type'");
      })
    ).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('should return error if id and type have wrong types', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'wrong-relation',
            id: 'test',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/relationships/test/data/id');
    expect(result[1].source.pointer).toBe('/data/relationships/test/data/type');
    expect(
      result.find(error => {
        return error.detail.includes("'id'");
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return error.detail.includes("'type'");
      })
    ).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('should return errors to many relationships', async () => {
    const attributesMock = {
      relationships: {
        second: {
          data: {
            type: 'wrong-relation',
            id: 'test',
          }
        },
        first: {
          data: {
            type: 'wrong-relation',
            id: 'test',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'first',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }, {
        propertyPath: 'second',
        inverseEntityMetadata: {
          name: 'relation-type'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );

    expect(result).toHaveLength(4);
  });

  it('should convert entity name to resource name', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: {
            type: 'relation-type',
            id: '1',
          }
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relationType'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
    );

    expect(result).toHaveLength(0);
  });

  it('should allow null data if flag passed', async () => {
    const attributesMock = {
      relationships: {
        test: {
          data: null
        }
      }
    } as unknown as RequestResourceData;
    const metadataMock = {
      relations: [{
        propertyPath: 'test',
        inverseEntityMetadata: {
          name: 'relationType'
        }
      }]
    } as EntityMetadata;

    const result = await checkResourceRelationsData(
      attributesMock,
      metadataMock,
      false,
    );

    expect(result).toHaveLength(0);
  });
});
