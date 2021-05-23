import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import { checkRelationDataBasicInfo } from './check-relation-data-basic-info';
import { BaseData } from '../../../types';


describe('CheckRelationDataBasicInfo', () => {
  it('should return no errors if correct data', async () => {
    const relationDataMock = { type: 'type', id: '1' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should return error if id not exists', async () => {
    const relationDataMock = { type: 'type' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data');
    expect(result[0].detail).toContain("'id'");
    expect(result).toHaveLength(1);
  });

  it('should return error if type not exists', async () => {
    const relationDataMock = { id: '1' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data');
    expect(result[0].detail).toContain("'type'");
    expect(result).toHaveLength(1);
  });

  it('should return error if id is not number', async () => {
    const relationDataMock = { id: '=(', type: 'type' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/id');
    expect(result[0].detail).toContain("'id'");
    expect(result).toHaveLength(1);
  });

  it('should return error if type not found', async () => {
    const relationDataMock = { id: '1', type: '=(' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result[0].source.pointer).toBe('/data/type');
    expect(result[0].detail).toContain("'type'");
    expect(result).toHaveLength(1);
  });

  it('should return many error messages', async () => {
    const relationDataMock = { id: '=(', type: '=(' } as BaseData;
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result).toHaveLength(2);
  });

  it('should return errors for data array', async () => {
    const relationDataMock = [
      { id: '=(', type: '=(' },
      { id: '=(', type: 'type'}
    ];
    const metadataMock = {
      inverseEntityMetadata: {
        name: 'type',
      }
    } as RelationMetadata;

    const result = await checkRelationDataBasicInfo(
      relationDataMock,
      metadataMock,
    );

    expect(result).toHaveLength(3);
  });
});
