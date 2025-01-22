import { BadRequestException } from '@nestjs/common';
import { QueryField } from '@klerick/json-api-nestjs-shared';
import { QueryFiledInIncludePipe } from './query-filed-in-include.pipe';
import { Users } from '../../../../mock-utils';
import { Query } from '../../zod';

describe('QueryFiledInIncludePipe', () => {
  let queryFiledInIncludePipe: QueryFiledInIncludePipe<Users>;

  beforeAll(() => {
    queryFiledInIncludePipe = new QueryFiledInIncludePipe<Users>();
  });

  it('Should be ok', () => {
    const check: Query<Users> = {
      [QueryField.fields]: {
        roles: ['id'],
      },
      [QueryField.include]: ['roles'],
      [QueryField.filter]: {
        target: null,
        relation: null,
      },
      [QueryField.sort]: null,
      [QueryField.page]: {
        number: 1,
        size: 1,
      },
    };

    const check2: Query<Users> = {
      [QueryField.fields]: null,
      [QueryField.include]: ['roles'],
      [QueryField.filter]: {
        target: null,
        relation: {
          roles: { name: { eq: 'test' } },
        },
      },
      [QueryField.sort]: null,
      [QueryField.page]: {
        number: 1,
        size: 1,
      },
    };

    const result = queryFiledInIncludePipe.transform(check);
    expect(result).toEqual(check);
    const result2 = queryFiledInIncludePipe.transform(check2);
    expect(result2).toEqual(check2);
  });

  it('Should be not ok', () => {
    const check: Query<Users> = {
      [QueryField.fields]: {
        roles: ['id'],
      },
      [QueryField.include]: null,
      [QueryField.filter]: {
        target: null,
        relation: null,
      },
      [QueryField.sort]: null,
      [QueryField.page]: {
        number: 1,
        size: 1,
      },
    };
    const check2: Query<Users> = {
      [QueryField.fields]: {
        roles: ['id'],
      },
      [QueryField.include]: null,
      [QueryField.filter]: {
        target: null,
        relation: null,
      },
      [QueryField.sort]: {
        addresses: {
          id: 'ASC',
        },
      },
      [QueryField.page]: {
        number: 1,
        size: 1,
      },
    };

    const check3: Query<Users> = {
      [QueryField.fields]: null,
      [QueryField.include]: null,
      [QueryField.filter]: {
        target: null,
        relation: {
          roles: { name: { eq: 'test' } },
        },
      },
      [QueryField.sort]: null,
      [QueryField.page]: {
        number: 1,
        size: 1,
      },
    };
    expect.assertions(3);
    try {
      queryFiledInIncludePipe.transform(check);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
    try {
      queryFiledInIncludePipe.transform(check2);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
    try {
      queryFiledInIncludePipe.transform(check3);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });
});
