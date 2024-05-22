import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_META_KEY } from '../../constants';
import { CheckAccessService } from '../check-access/check-access.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(Reflector) private reflector!: Reflector;
  @Inject(CheckAccessService) private checkAccessService!: CheckAccessService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_META_KEY,
      [context.getClass(), context.getHandler()]
    );
    return isPublic || this.checkAccessService.checkAccess(context);
  }
}
