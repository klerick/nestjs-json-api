import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CheckItemEntityPipe } from './check-item-entity.pipe';
import { CURRENT_ENTITY, FIND_ONE_ROW_ENTITY } from '../../../../constants';
import { EntityTarget } from 'typeorm/common/EntityTarget';

describe('CheckItemEntityPipe', () => {
  let pipe: CheckItemEntityPipe<any, any>;
  let mockFindOneRowEntity: jest.Mock;
  let mockEntityTarget: EntityTarget<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckItemEntityPipe,
        { provide: CURRENT_ENTITY, useValue: {} },
        { provide: FIND_ONE_ROW_ENTITY, useValue: jest.fn() },
      ],
    }).compile();

    pipe = module.get<CheckItemEntityPipe<any, any>>(CheckItemEntityPipe);
    mockEntityTarget = module.get<EntityTarget<any>>(CURRENT_ENTITY);
    mockFindOneRowEntity = module.get<jest.Mock>(FIND_ONE_ROW_ENTITY);
  });

  it('should call findOneRowEntity and return the entity', async () => {
    const mockEntity = { id: 1, name: 'Test Entity' };
    const mockValue = 1;

    mockFindOneRowEntity.mockResolvedValue(mockEntity);
    const result = await pipe.transform(mockValue);

    expect(mockFindOneRowEntity).toHaveBeenCalledTimes(1);
    expect(mockFindOneRowEntity).toHaveBeenCalledWith(
      mockEntityTarget,
      mockValue
    );

    expect(result).toBe(mockValue);
  });

  it('should throw a NotFoundException if no entity is found', async () => {
    const mockValue = 1;

    mockFindOneRowEntity.mockResolvedValue(null);

    await expect(pipe.transform(mockValue)).rejects.toThrow(NotFoundException);

    expect(mockFindOneRowEntity).toHaveBeenCalledTimes(1);
    expect(mockFindOneRowEntity).toHaveBeenCalledWith(
      mockEntityTarget,
      mockValue
    );
  });
});
