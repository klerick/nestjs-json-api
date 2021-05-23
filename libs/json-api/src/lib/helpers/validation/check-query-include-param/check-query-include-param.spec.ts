import { EntityMetadata } from 'typeorm';

import { QueryField, QueryParams } from '../../../types';
import { checkQueryIncludeParam } from '..';


describe('CheckQueryIncludeParam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no errors if data right', async () => {
    const metadataMock = {
      relations: [{
        propertyPath: 'relation',
      }]
    } as EntityMetadata;
    const paramsMock = {
      include: [
        'relation'
      ]
    } as unknown as QueryParams;

    const result = await checkQueryIncludeParam(paramsMock, metadataMock);
    expect(result).toHaveLength(0);
  });

  it('should return error if relation does not exist', async () => {
    const metadataMock = {
      relations: [{
        propertyPath: 'relation',
      }]
    } as EntityMetadata;
    const paramsMock = {
      include: [
        'wrong-relation'
      ]
    } as unknown as QueryParams;

    const result = await checkQueryIncludeParam(paramsMock, metadataMock);
    expect(result[0].source.parameter).toBe(QueryField.include);
    expect(result[0].detail).toContain("'wrong-relation'");
    expect(result).toHaveLength(1);
  });

  it('should return multiple errors on each wrong include', async () => {
    const metadataMock = {
      relations: [{
        propertyPath: 'relation',
      }]
    } as EntityMetadata;
    const paramsMock = {
      include: [
        'next-wrong-relation',
        'wrong-relation',
        'relation',
      ]
    } as unknown as QueryParams;

    const result = await checkQueryIncludeParam(paramsMock, metadataMock);
    expect(result).toHaveLength(2);
  });
});
