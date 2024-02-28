import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { entityForClass } from 'json-api-nestjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

export const EntityName = Reflector.createDecorator<string>();

@Injectable()
export class GuardService implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const query = context.switchToHttp().getRequest<Request>().query;
    const typeCall = (query as any)?.filter?.firstName?.eq;

    if (typeCall === 'testControllerGuard') {
      return false;
    }

    if (typeCall === 'testMethodeGuard') {
      const entityName = this.reflector.get(EntityName, context.getHandler());
      if (!entityName) throw new BadRequestException();

      // @ts-ignore
      if (entityForClass(context.getClass()).name === entityName) {
        throw new ForbiddenException('Not allow to ' + entityName);
      }
    }

    return true;
  }
}
