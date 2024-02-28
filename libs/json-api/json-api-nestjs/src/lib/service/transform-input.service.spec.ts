import { TransformInputService } from './transform-input.service';
import { ASC, DESC } from '../constants';
import { Users } from '../mock-utils';
import { QueryField, TypeInputProps } from '../helper';

describe('TransformInputService', () => {
  let transformInputService: TransformInputService<Users>;

  beforeAll(() => {
    transformInputService = new TransformInputService<Users>();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('TransformInputService.transformSort', () => {
    const check = 'id,manager.id,-roles.id,updatedAt,-createdAt';
    const checkResult = {
      target: {
        id: ASC,
        updatedAt: ASC,
        createdAt: DESC,
      },
      manager: {
        id: ASC,
      },
      roles: {
        id: DESC,
      },
    };

    const check2 = 'id';
    const checkResult2 = {
      target: {
        id: ASC,
      },
    };

    const check3 = '';

    const result = transformInputService.transformSort(check);
    const result2 = transformInputService.transformSort(undefined);
    const result3 = transformInputService.transformSort(check2);
    const result4 = transformInputService.transformSort(check3);
    expect(result).toEqual(checkResult);
    expect(result2).toBe(null);
    expect(result4).toBe(null);
  });

  it('TransformInputService.transformInclude', () => {
    const check = 'manager,roles,,notes,';
    const checkResult = ['manager', 'roles', 'notes'];

    const check2 = '';

    const check3 = 'manager';
    const checkResult3 = ['manager'];

    const result = transformInputService.transformInclude(check);
    const result2 = transformInputService.transformInclude(undefined);
    const result3 = transformInputService.transformInclude(check2);
    const result4 = transformInputService.transformInclude(check3);
    expect(result).toEqual(checkResult);
    expect(result2).toBe(null);
    expect(result3).toBe(null);
    expect(result4).toEqual(checkResult3);
  });

  it('TransformInputService.transformFields', () => {
    const check = {
      target: 'id,updatedAt,createdAt',
      manager: 'id',
      roles: 'id,key',
    };
    const check2 = {
      target: 'id,updatedAt,createdAt',
    };
    const check3 = {
      roles: 'id,key',
    };
    const check4 = {
      target: '',
      roles: '',
    };
    const check5 = {
      target: 'id,updatedAt,createdAt',
      roles: '',
    };
    const checkResult = {
      target: ['id', 'updatedAt', 'createdAt'],
      manager: ['id'],
      roles: ['id', 'key'],
    };
    const checkResult2 = {
      target: ['id', 'updatedAt', 'createdAt'],
    };
    const checkResult3 = {
      roles: ['id', 'key'],
    };

    const checkResult5 = {
      target: ['id', 'updatedAt', 'createdAt'],
    };

    const result = transformInputService.transformFields(check);
    const result2 = transformInputService.transformFields(undefined);
    const result3 = transformInputService.transformFields({});
    const result4 = transformInputService.transformFields(check2);
    const result5 = transformInputService.transformFields(check3 as any);
    const result6 = transformInputService.transformFields(check4 as any);
    const result7 = transformInputService.transformFields(check5 as any);
    expect(result).toEqual(checkResult);
    expect(result2).toBe(null);
    expect(result3).toBe(null);
    expect(result4).toEqual(checkResult2);
    expect(result5).toEqual(checkResult3);
    expect(result6).toEqual(null);
    expect(result7).toEqual(checkResult5);
  });

  it('TransformInputService.transformFilter', () => {
    const check1: TypeInputProps<Users, QueryField.filter> = {
      id: {
        in: 'in-test',
        nin: 'nin-test,nin-test2',
      },
      isActive: 'true',
      manager: {
        eq: 'null',
      },
      'addresses.arrayField': {
        some: 'some-test',
      },
      'addresses.createdAt': '2023-01-01',
      'userGroup.label': {
        like: 'test',
      },
    };
    const checkResult1 = {
      target: {
        id: {
          in: ['in-test'],
          nin: ['nin-test', 'nin-test2'],
        },
        isActive: {
          eq: 'true',
        },
        manager: {
          eq: 'null',
        },
      },
      relation: {
        addresses: {
          arrayField: {
            some: ['some-test'],
          },
          createdAt: {
            eq: '2023-01-01',
          },
        },
        userGroup: {
          label: { like: 'test' },
        },
      },
    };

    const check2: TypeInputProps<Users, QueryField.filter> = {
      id: '',
      'addresses.arrayField': {},
      'addresses.createdAt': '2023-01-01',
      'userGroup.label': {},
    };
    const checkResult2 = {
      target: {
        id: {
          eq: '',
        },
      },
      relation: {
        addresses: {
          createdAt: {
            eq: '2023-01-01',
          },
        },
      },
    };

    const result1 = transformInputService.transformFilter(check1);
    expect(result1).toEqual(checkResult1);

    const result2 = transformInputService.transformFilter(check2);
    expect(result2).toEqual(checkResult2);

    expect(transformInputService.transformFilter(undefined)).toEqual({
      target: null,
      relation: null,
    });
  });
});
