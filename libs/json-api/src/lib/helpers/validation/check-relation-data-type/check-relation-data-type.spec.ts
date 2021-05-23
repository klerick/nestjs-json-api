import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import { checkRelationDataType } from './check-relation-data-type';
import { BaseData } from '../../../types';


describe('CheckRelationDataType', () => {
  it('should return no errors if correct data', async () => {
    const relationDataMock = { type: 'type', id: '1' } as BaseData;
    const metadataMock = {
      relationType: 'many-to-one',
    } as RelationMetadata;

    const result = await checkRelationDataType(
      relationDataMock,
      metadataMock,
    );
    expect(result).toHaveLength(0);
  });

  it('should return errors for many-to-one and array data', async () => {
    const relationDataMock = [{ type: 'type', id: '1' }] as BaseData[];
    const metadataMock = {
      propertyName: 'relation-name',
      relationType: 'many-to-one',
    } as RelationMetadata;

    const result = await checkRelationDataType(
      relationDataMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data');
    expect(result[0].detail).toContain("'relation-name'");
    expect(result).toHaveLength(1);
  });

  it('should return errors for one-to-one and array data', async () => {
    const relationDataMock = [{ type: 'type', id: '1' }] as BaseData[];
    const metadataMock = {
      propertyName: 'relation-name',
      relationType: 'one-to-one',
    } as RelationMetadata;

    const result = await checkRelationDataType(
      relationDataMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data');
    expect(result[0].detail).toContain("'relation-name'");
    expect(result).toHaveLength(1);
  });

  it('should return errors for many-to-many and object data', async () => {
    const relationDataMock = { type: 'type', id: '1' } as BaseData;
    const metadataMock = {
      propertyName: 'relation-name',
      relationType: 'many-to-many',
    } as RelationMetadata;

    const result = await checkRelationDataType(
      relationDataMock,
      metadataMock,
    );
    expect(result[0].source.pointer).toBe('/data');
    expect(result[0].detail).toContain("'relation-name'");
    expect(result).toHaveLength(1);
  });

  it('should return errors for one-to-many ', async () => {
    const relationDataMock = { type: 'type', id: '1' } as BaseData;
    const metadataMock = {
      propertyName: 'relation-name',
      relationType: 'one-to-many',
    } as RelationMetadata;

    const result = await checkRelationDataType(
      relationDataMock,
      metadataMock,
    );
    expect(result[0].source).toBeUndefined();
    expect(result[0].detail).toContain("'relation-name'");
    expect(result).toHaveLength(1);
  });
});
