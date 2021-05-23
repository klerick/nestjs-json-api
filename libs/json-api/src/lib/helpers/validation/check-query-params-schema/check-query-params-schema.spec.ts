import { checkQueryParamsSchema } from './check-query-params-schema';
import { QueryParams, SortDirection } from '../../../types';


describe('CheckQueryParamsSchema', () => {
  it('should not return errors if data correct', async () => {
    const mockData = {
      include: [
        'relation'
      ],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {
        'field': SortDirection.DESC
      },
      page: {
        number: 1,
        size: 10,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);
    expect(result).toHaveLength(0);
  });

  it('should return an error if include not unique', async () => {
    const mockData = {
      include: [
        'relation',
        'relation',
      ],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {
        'field': SortDirection.DESC
      },
      page: {
        number: 1,
        size: 10,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);
    expect(result[0].source.parameter).toBe('include');
    expect(result[0].detail).toContain("'include'");
    expect(result).toHaveLength(1);
  });

  it('should return an error if include empty array', async () => {
    const mockData = {
      include: [],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {
        'field': SortDirection.DESC
      },
      page: {
        number: 1,
        size: 10,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);
    expect(result[0].source.parameter).toBe('include');
    expect(result[0].detail).toContain("'include'");
    expect(result).toHaveLength(1);
  });

  it('should return an error if page props have wrong type', async () => {
    const mockData = {
      include: [
        'relation',
      ],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {
        'field': SortDirection.DESC
      },
      page: {
        number: '1' as unknown as number,
        size: '10' as unknown as number,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);

    expect(
      result.find(error => {
        return (error.source.parameter === 'page') &&
          (error.detail.includes("'page.size'"));
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return (error.source.parameter === 'page') &&
          (error.detail.includes("'page.number'"));
      })
    ).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('should return an error if page has no enough props', async () => {
    const mockData = {
      include: [
        'relation',
      ],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {
        'field': SortDirection.DESC
      },
      page: {} as any
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);

    expect(result[0].source.parameter).toBe('page');
    expect(result[0].detail).toContain("'page'");
    expect(result).toHaveLength(1);
  });

  it('should return an error if filter has no enough props', async () => {
    const mockData = {
      include: [
        'relation',
      ],
      filter: {},
      sort: {
        'field': SortDirection.DESC
      },
      page: {
        number: 1,
        size: 10,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);

    expect(result[0].source.parameter).toBe('filter');
    expect(result[0].detail).toContain("'filter'");
    expect(result).toHaveLength(1);
  });

  it('should return an error if sort has no enough props', async () => {
    const mockData = {
      include: [
        'relation',
      ],
      filter: {
        'field': {
          'eq': '1',
        }
      },
      sort: {},
      page: {
        number: 1,
        size: 10,
      }
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);

    expect(result[0].source.parameter).toBe('sort');
    expect(result[0].detail).toContain("'sort'");
    expect(result).toHaveLength(1);
  });

  it('should return many errors for each props', async () => {
    const mockData = {
      include: [
        'relation',
        'relation',
      ],
      filter: {},
      sort: {},
      page: {}
    } as QueryParams;
    const result = await checkQueryParamsSchema(mockData);

    expect(
      result.find(error => {
        return (error.source.parameter === 'page');
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return (error.source.parameter === 'sort');
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return (error.source.parameter === 'filter');
      })
    ).toBeDefined();
    expect(
      result.find(error => {
        return (error.source.parameter === 'include');
      })
    ).toBeDefined();
    expect(result).toHaveLength(4);
  });
});
