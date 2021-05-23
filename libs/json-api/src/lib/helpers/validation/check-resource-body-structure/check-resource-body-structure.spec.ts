import { EntityMetadata } from 'typeorm';

import { checkResourceBodyStructure } from './check-resource-body-structure';
import { RequestResourceData } from '../../../types';


describe('CheckResourceBodyStructure', () => {
  it('should return no errors if correct data', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should return errors id do not sent', async () => {
    const relationDataMock = {
      type: 'some-entity',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'id'") &&
        item.source.pointer === '/data';
    })).toBeDefined();
  });

  it('should return errors if id is not number', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: 'word',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'id'") &&
        item.source.pointer === '/data/id';
    })).toBeDefined();
  });

  it('should complete without errors if id not required', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: 'word',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
      false,
      false,
    );

    expect(result).toHaveLength(0);
  });

  it('should return errors if type does not exist', async () => {
    const relationDataMock = {
      id: 'word',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'type'") &&
        item.source.pointer === '/data';
    })).toBeDefined();
  });

  it('should return errors if type different to relation', async () => {
    const relationDataMock = {
      type: 'relation',
      id: 'word',
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'type'") &&
        item.source.pointer === '/data/type';
    })).toBeDefined();
  });

  it('should return errors if data not exist', async () => {
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      undefined,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'data'") &&
        item.source.pointer === '';
    })).toBeDefined();
  });

  it('should return errors if data not exist', async () => {
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      undefined,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'data'") &&
        item.source.pointer === '';
    })).toBeDefined();
  });

  it('should return errors attributes have wrong type', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
      attributes: 1 as any,
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/attributes');
  });

  it('should return errors relationships have wrong type', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
      relationships: 1 as any,
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/relationships');
  });

  it('should return errors if relationships do not have data', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
      relationships: {
        second: {},
        first: {},
      } as any,
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
    );

    expect(result.find(item => {
      return item.detail.includes("'second'") &&
        item.source.pointer === '/data/relationships/second/data';
    })).toBeDefined();
    expect(result.find(item => {
      return item.detail.includes("'first'") &&
        item.source.pointer === '/data/relationships/first/data';
    })).toBeDefined();
  });

  it('should return errors when relations not nullable', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
      relationships: {
        second: {
          data: null
        }
      } as any,
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
      false
    );

    expect(result.find(item => {
      return item.detail.includes("'second'") &&
        item.source.pointer === '/data/relationships/second/data';
    })).toBeDefined();
  });

  it('should not return errors when relations are nullable', async () => {
    const relationDataMock = {
      type: 'some-entity',
      id: '1',
      relationships: {
        second: {
          data: null
        }
      } as any,
    } as RequestResourceData;
    const metadataMock = {
      name: 'SomeEntity',
    } as EntityMetadata;

    const result = await checkResourceBodyStructure(
      relationDataMock,
      metadataMock,
      true
    );

    expect(result).toHaveLength(0);
  });
});
