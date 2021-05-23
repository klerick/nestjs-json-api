import { EntityMetadata } from 'typeorm';

import { QueryParams, SortDirection } from '../../../types';
import { checkQuerySortParam } from '..';
import * as helpers from '..';

jest.mock('../check-entity-field-metadata/check-entity-field-metadata');


describe('CheckQuerySortParam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return no errors if data right', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([]);
    const metadataMock = {} as EntityMetadata;
    const paramsMock = {
      sort: {
        field: SortDirection.ASC,
      }
    } as unknown as QueryParams;

    const result = await checkQuerySortParam(paramsMock, metadataMock);
    expect(checkMetadataMock).toBeCalled();
    expect(result).toHaveLength(0);
  });

  it('should return no errors sort fields wrong', async () => {
    const checkMetadataMock = (helpers.checkEntityFieldMetadata as unknown as jest.Mock).mockReturnValue([{}]);
    const metadataMock = {} as EntityMetadata;
    const paramsMock = {
      sort: {
        another: SortDirection.ASC,
        field: SortDirection.ASC,
      }
    } as unknown as QueryParams;

    const result = await checkQuerySortParam(paramsMock, metadataMock);
    expect(checkMetadataMock).toBeCalledTimes(2);
    expect(result).toHaveLength(2);
  });

});
