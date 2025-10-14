import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { QueryField } from '@klerick/json-api-nestjs-shared';

import { QueryCheckSelectField } from './query-check-select-field';
import { Users } from '../../../../utils/___test___/test-classes.helper';
import { CONTROLLER_OPTIONS_TOKEN } from '../../../../constants';
import { Query } from '../../zod';
import { EntityControllerParam } from '../../types';

function getDefaultQuery<R extends object>() {
  const filter = {
    relation: null,
    target: null,
  };
  const defaultQuery: Query<R, 'id'> = {
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
  let configParam: EntityControllerParam;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CONTROLLER_OPTIONS_TOKEN,
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
    configParam = module.get<EntityControllerParam>(CONTROLLER_OPTIONS_TOKEN);
  });

  it('Is valid', () => {
    const query = getDefaultQuery<Users>();
    expect(queryCheckSelectField.transform(query)).toEqual(query);
  });

  it('Is invalid', () => {
    const query = getDefaultQuery<Users>();
    vi.mocked(configParam).requiredSelectField = true;
    expect.assertions(1);
    try {
      queryCheckSelectField.transform(query);
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
});
