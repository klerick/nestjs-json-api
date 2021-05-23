import { EntityMetadata } from 'typeorm';

import { checkResourceRelationName } from './check-resource-relation-name';


describe('CheckResourceRelationsType', () => {
  it('should return no errors if correct data', async () => {
    const metadataMock = {
      relations: [{
        propertyPath: 'some-name',
      }],
      name: 'entity-name'
    } as EntityMetadata;

    const result = await checkResourceRelationName('some-name', metadataMock);
    expect(result).toHaveLength(0);
  });

  it('should return errors if relation does not exist', async () => {
    const metadataMock = {
      relations: [{
        propertyPath: 'some-name',
      }],
      name: 'entity-name'
    } as EntityMetadata;

    const result = await checkResourceRelationName('wrong-name', metadataMock);
    expect(result[0].detail).toContain("'wrong-name'");
    expect(result).toHaveLength(1);
  });
});
