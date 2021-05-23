import { IsNotEmpty, IsString } from 'class-validator';
import { EntityMetadata } from 'typeorm';

import { checkClassValidatorFields } from './check-class-validator-fields';
import { RequestResourceData } from '../../../types';


describe('CheckResourceAttributes', () => {
  it('should return no errors if correct data', async () => {
    const attributesMock = {
      attributes: {
        name: 'some-name',
        type: 'some-type',
      }
    } as unknown as RequestResourceData;
    const entityMock = class Entity {
      public name: string;
      public type: string;
    };
    IsNotEmpty()(entityMock.prototype, 'type');
    IsString()(entityMock.prototype, 'name');
    const metadataMock = {
      target: entityMock as Function,
    } as EntityMetadata;

    const result = await checkClassValidatorFields(
      attributesMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should validate missing props whe flag passed', async () => {
    const attributesMock = {
      attributes: {
        type: 'some-type',
      }
    } as unknown as RequestResourceData;
    const entityMock = class Entity {
      public name: string;
      public type: string;
    };
    IsNotEmpty()(entityMock.prototype, 'type');
    IsString()(entityMock.prototype, 'name');
    const metadataMock = {
      target: entityMock as Function,
    } as EntityMetadata;

    const result = await checkClassValidatorFields(
      attributesMock,
      metadataMock,
      true
    );
    expect(result).toHaveLength(0);
  });

  it('should validate all props when skipping switched off', async () => {
    const attributesMock = {
      attributes: {
        type: 'some-type',
      },
      relationships: []
    } as unknown as RequestResourceData;
    const entityMock = class Entity {
      public name: string;
      public type: string;
    };
    IsNotEmpty()(entityMock.prototype, 'type');
    IsString()(entityMock.prototype, 'name');
    const metadataMock = {
      target: entityMock as Function,
      relations: [],
    } as EntityMetadata;

    const result = await checkClassValidatorFields(
      attributesMock,
      metadataMock,
      false
    );
    expect(result[0].source.pointer).toBe('/data/attributes/name');
    expect(result).toHaveLength(1);
  });

  it('should return error for many-to-one reuired field', async () => {
    const attributesMock = {
      attributes: {
        type: 'some-type',
        name: 'name'
      },
      relationships: []
    } as unknown as RequestResourceData;
    const entityMock = class Entity {
      public name: string;
      public type: string;
    };
    IsNotEmpty()(entityMock.prototype, 'relation');
    IsNotEmpty()(entityMock.prototype, 'type');
    IsString()(entityMock.prototype, 'name');
    const metadataMock = {
      target: entityMock as Function,
      relations: [{
        propertyPath: 'relation'
      }],
    } as EntityMetadata;

    const result = await checkClassValidatorFields(
      attributesMock,
      metadataMock,
      false
    );
    expect(result[0].source.pointer).toBe('/data/relationships/relation');
    expect(result[0].detail).toContain('relation');
    expect(result).toHaveLength(1);
  });

  it('should return errors when attributes are not correct', async () => {
    const attributesMock = {
      attributes: {
        name: 1,
        type: undefined,
      },
      relationships: []
    } as undefined as RequestResourceData;
    const entityMock = class Entity {
      public name: string;
      public type: string;
    };
    IsNotEmpty()(entityMock.prototype, 'type');
    IsString()(entityMock.prototype, 'name');
    const metadataMock = {
      target: entityMock as Function,
      relations: [],
    } as EntityMetadata;

    const result = await checkClassValidatorFields(
      attributesMock,
      metadataMock,
      false
    );
    expect(
      result.find(error => {
        return error.source.pointer === '/data/attributes/type';
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return error.source.pointer === '/data/attributes/name';
      })
    ).toBeDefined();
    expect(result).toHaveLength(2);
  });
});
