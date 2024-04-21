import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { CheckAccessService } from './check-access.service';
import { JsonApi } from 'json-api-nestjs';
import { RawRuleOf } from '@casl/ability';
import { AbilityRules, Actions } from '../../types';

describe('CheckAccessService', () => {
  let checkAccessService: CheckAccessService;
  let context: ExecutionContext;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CheckAccessService],
    }).compile();

    checkAccessService = moduleRef.get<CheckAccessService>(CheckAccessService);
    context = {
      getClass: jest.fn(),
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        method: 'GET',
      }),
    } as unknown as ExecutionContext;
  });

  describe('validate input before checkAccess', () => {
    it('should return false if the request does not contain a user', async () => {
      const httpContext = context.switchToHttp();
      @JsonApi(class TestEntity {})
      class TestControllerJsonApi {}
      jest.spyOn(context, 'getClass').mockReturnValue(TestControllerJsonApi);
      jest.spyOn(httpContext, 'getRequest').mockReturnValue({} as Request);
      const result = await checkAccessService.checkAccess(context);
      expect(result).toEqual(false);
    });

    it('should return true, entity doesnt assign to controller', async () => {
      const httpContext = context.switchToHttp();
      jest.spyOn(httpContext, 'getRequest').mockReturnValue({} as Request);

      jest.spyOn(context, 'getClass').mockReturnValue(class TestController {});
      const result = await checkAccessService.checkAccess(context);
      expect(result).toEqual(true);
    });

    it('should throw error incorrect http methode', async () => {
      const permissionRules: RawRuleOf<AbilityRules>[] = [];
      const httpContext = context.switchToHttp();
      jest
        .spyOn(httpContext, 'getRequest')
        .mockReturnValue({ permissionRules, user: {} } as Request);
      httpContext.getRequest<Request>().method = 'incorrect';
      @JsonApi(class TestEntity {})
      class TestControllerJsonApi {}
      jest.spyOn(context, 'getClass').mockReturnValue(TestControllerJsonApi);
      expect.assertions(1);
      try {
        await checkAccessService.checkAccess(context);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });

    it('return true because permissionRules empty', async () => {
      class TestEntity {}

      @JsonApi(TestEntity)
      class TestControllerJsonApi {}

      const permissionRules: RawRuleOf<AbilityRules>[] = [
        { action: Actions.create, subject: TestEntity.name },
        { action: Actions.delete, subject: TestEntity.name },
        { action: Actions.update, subject: TestEntity.name },
        {
          action: Actions.update,
          subject: 'subject1',
          conditions: { id: '${currentUser.id}' },
        },
      ];
      const httpContext = context.switchToHttp();
      jest.spyOn(httpContext, 'getRequest').mockReturnValue({
        permissionRules,
        method: 'GET',
        user: {},
      } as Request);

      jest.spyOn(context, 'getClass').mockReturnValue(TestControllerJsonApi);
      const result = await checkAccessService.checkAccess(context);
      expect(result).toBe(true);
    });
  });
});
