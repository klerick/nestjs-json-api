import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import { PermissionGuard } from './permission.guard';
import { CheckAccessService } from '../check-access/check-access.service';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let checkAccessService: CheckAccessService;
  let context: ExecutionContext;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PermissionGuard, Reflector, CheckAccessService],
    }).compile();

    guard = moduleRef.get<PermissionGuard>(PermissionGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
    checkAccessService = moduleRef.get<CheckAccessService>(CheckAccessService);
    context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should return true when public meta key is true', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const checkAccessServiceSpy = jest
      .spyOn(checkAccessService, 'checkAccess')
      .mockResolvedValue(true);
    const result = await guard.canActivate(context);
    expect(result).toEqual(true);
    expect(checkAccessServiceSpy).toHaveBeenCalledTimes(0);
  });

  it('should return false when public meta key is false', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const checkAccessServiceSpy = jest
      .spyOn(checkAccessService, 'checkAccess')
      .mockResolvedValue(false);
    const result = await guard.canActivate(context);
    expect(result).toEqual(false);
    expect(checkAccessServiceSpy).toHaveBeenCalledTimes(1);
  });

  it('should return true when public meta key is false', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const checkAccessServiceSpy = jest
      .spyOn(checkAccessService, 'checkAccess')
      .mockResolvedValue(true);
    const result = await guard.canActivate(context);
    expect(result).toEqual(true);
    expect(checkAccessServiceSpy).toHaveBeenCalledTimes(1);
  });
});
