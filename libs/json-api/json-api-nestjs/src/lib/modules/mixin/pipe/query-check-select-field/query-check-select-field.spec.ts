import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { QueryField } from '../../../../utils/nestjs-shared';

import { QueryCheckSelectField } from './query-check-select-field';
import { Users } from '../../../../mock-utils/typeorm';
import { CONTROL_OPTIONS_TOKEN } from '../../../../constants';
import { Query } from '../../zod';
import { ConfigParam, ObjectLiteral } from '../../../../types';

function getDefaultQuery<R extends ObjectLiteral>() {
  const filter = {
    relation: null,
    target: null,
  };
  const defaultQuery: Query<R> = {
    [QueryField.filter]: filter,
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: 1,
      number: 1,
    },
  };

  return defaultQuery;
}

describe('QueryCheckSelectField', () => {
  let queryCheckSelectField: QueryCheckSelectField<Users>;
  let configParam: ConfigParam;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CONTROL_OPTIONS_TOKEN,
          useValue: {
            requiredSelectField: false,
            debug: false,
          },
        },
        QueryCheckSelectField,
      ],
    }).compile();

    queryCheckSelectField = module.get<QueryCheckSelectField<Users>>(
      QueryCheckSelectField
    );
    configParam = module.get<ConfigParam>(CONTROL_OPTIONS_TOKEN);
  });

  it('Is valid', () => {
    const query = getDefaultQuery<Users>();
    expect(queryCheckSelectField.transform(query)).toEqual(query);
  });

  it('Is invalid', () => {
    const query = getDefaultQuery<Users>();
    jest.mocked(configParam).requiredSelectField = true;
    expect.assertions(1);
    try {
      queryCheckSelectField.transform(query);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
