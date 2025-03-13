import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { EntityClass } from '@klerick/json-api-nestjs-shared';
import { ParseRelationshipNamePipe } from './parse-relationship-name.pipe';
import { CURRENT_ENTITY, CHECK_RELATION_NAME } from '../../../../constants';
import { EntityParam } from '../../../../types';

describe('CheckItemEntityPipe', () => {
  let pipe: ParseRelationshipNamePipe<
    object,
    keyof EntityParam<object, 'id'>['relationProperty']
  >;
  let checkRelationNameMock: jest.Mock;
  let mockEntityTarget: EntityClass<object>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseRelationshipNamePipe,
        { provide: CURRENT_ENTITY, useValue: {} },
        { provide: CHECK_RELATION_NAME, useValue: jest.fn() },
      ],
    }).compile();

    pipe = module.get<
      ParseRelationshipNamePipe<
        object,
        keyof EntityParam<object, 'id'>['relationProperty']
      >
    >(ParseRelationshipNamePipe);
    mockEntityTarget = module.get<EntityClass<object>>(CURRENT_ENTITY);
    checkRelationNameMock = module.get<jest.Mock>(CHECK_RELATION_NAME);
  });

  it('should call findOneRowEntity and return the entity', async () => {
    const mockValue = 'name';

    checkRelationNameMock.mockReturnValueOnce(true);
    const result = await pipe.transform(mockValue);

    expect(checkRelationNameMock).toHaveBeenCalledTimes(1);
    expect(checkRelationNameMock).toHaveBeenCalledWith(
      mockEntityTarget,
      mockValue
    );

    expect(result).toBe(mockValue);
  });

  it('should throw a UnprocessableEntityException if no entity is found', async () => {
    const mockValue = 'name';

    checkRelationNameMock.mockReturnValueOnce(false);

    expect(() => pipe.transform(mockValue)).toThrow(
      UnprocessableEntityException
    );

    expect(checkRelationNameMock).toHaveBeenCalledTimes(1);
    expect(checkRelationNameMock).toHaveBeenCalledWith(
      mockEntityTarget,
      mockValue
    );
  });
});
