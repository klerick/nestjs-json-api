import { EntityMetadata } from 'typeorm';

import { FilterOperand, QueryField, QueryParams } from '../../../types';
import { checkQueryFilterParam } from '..';
import * as helpers from '..';

jest.mock('../check-entity-field-metadata/check-entity-field-metadata');


describe('CheckQueryFilterParam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no errors if data right', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {
      relations: [],
      columns: [],
    } as EntityMetadata;
    const paramsMock = {
      filter: {
        field: {
          eq: 'test'
        }
      }
    } as unknown as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);
    expect(checkMetadataMock).toBeCalled();
    expect(result).toHaveLength(0);
  });

  it('should return error if incorrect operand', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {
      relations: [],
      columns: [],
    } as EntityMetadata;
    const paramsMock = {
      filter: {
        field: {
          wrong: 'test'
        }
      }
    } as unknown as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);

    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'wrong'");
    expect(checkMetadataMock).not.toBeCalled();
    expect(result).toHaveLength(1);
  });

  it('should return  multiple errors if incorrect operand', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {
      relations: [],
      columns: [],
    } as EntityMetadata;
    const paramsMock = {
      filter: {
        thirdField: {
          eq: 'test'
        },
        secondField: {
          wrong: 'test'
        },
        field: {
          wrong: 'test'
        }
      }
    } as unknown as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);
    expect(checkMetadataMock).toBeCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  it('should return error on relation existance appropriate operands', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {
      relations: [{
        propertyPath: 'thirdField',
      }],
      columns: [],
    } as EntityMetadata;
    const paramsMock = {
      filter: {
        thirdField: {
          le: 'null'
        },
      }
    } as unknown as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);

    expect(result[0].detail).toContain(`${FilterOperand.eq}`);
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(checkMetadataMock).not.toBeCalled();
    expect(result).toHaveLength(1);
  });

  it('should return error on relation existance wrong value', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {
      relations: [{
        propertyPath: 'thirdField',
      }],
      columns: [],
    } as EntityMetadata;
    const paramsMock = {
      filter: {
        thirdField: {
          eq: 'value'
        },
      }
    } as unknown as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);

    expect(result[0].detail).toContain("'null'");
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(checkMetadataMock).not.toBeCalled();
    expect(result).toHaveLength(1);
  });

  it('should return no errors if field is array', async () => {
    const checkMetadataMock = ((helpers.checkEntityFieldMetadata as unknown) as jest.Mock).mockReturnValue(
      []
    );
    const metadataMock = {
      relations: [],
      columns: [{ isArray: true, propertyPath: 'field' }],
    } as EntityMetadata;
    const paramsMock = ({
      filter: {
        field: {
          some: 'test',
        },
      },
    } as unknown) as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);
    expect(checkMetadataMock).toBeCalled();
    expect(result).toHaveLength(0);
  });

  it('should return errors if field is non-array', async () => {
    const checkMetadataMock = ((helpers.checkEntityFieldMetadata as unknown) as jest.Mock).mockReturnValue(
      []
    );
    const metadataMock = {
      relations: [],
      columns: [],
    } as EntityMetadata;
    const paramsMock = ({
      filter: {
        field: {
          some: 'test',
        },
      },
    } as unknown) as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'some'");
    expect(checkMetadataMock).not.toBeCalled();
    expect(result).toHaveLength(1);
  });

  it('should return errors if incorrect operand in array field', async () => {
    const checkMetadataMock = ((helpers.checkEntityFieldMetadata as unknown) as jest.Mock).mockReturnValue(
      []
    );
    const metadataMock = {
      relations: [],
      columns: [{ isArray: true, propertyPath: 'field' }],
    } as EntityMetadata;
    const paramsMock = ({
      filter: {
        field: {
          eq: 'test',
        },
      },
    } as unknown) as QueryParams;

    const result = await checkQueryFilterParam(paramsMock, metadataMock);
    expect(result[0].source.parameter).toBe(QueryField.filter);
    expect(result[0].detail).toContain("'eq'");
    expect(checkMetadataMock).not.toBeCalled();
    expect(result).toHaveLength(1);
  });
});
