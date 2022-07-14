import { queryNeedAttributeMixin } from './query-need-attribute';
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('QueryNeedAttribute', () => {
  const entityMock = class SomeEntityMock {};
  const pipeMixin = queryNeedAttributeMixin(entityMock);
  let pipe: PipeTransform;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [pipeMixin]
    }).compile();

    pipe = module.get<PipeTransform>(pipeMixin);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('Not have param, should be false', () => {
    const result = pipe.transform({}, {} as ArgumentMetadata);
    expect(result).toEqual({needAttribute: false})
  })

  it('have param false, should be false', () => {
    const result = pipe.transform({['need-attribute']: false}, {} as ArgumentMetadata);
    expect(result).toEqual({needAttribute: false})
  })

  it('have param true, should be true', () => {
    const result = pipe.transform({['need-attribute']: true}, {} as ArgumentMetadata);
    expect(result).toEqual({needAttribute: true})
  })
})
