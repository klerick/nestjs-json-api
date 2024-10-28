import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { entityForClass } from 'json-api-nestjs';

import { checkInputHttpMethod } from '../../utils';
import { MethodActionMap } from '../../constants';
import { Actions } from '../../types';

@Injectable()
export class CheckAccessService {
  private readonly logger = new Logger(CheckAccessService.name);

  public async checkAccess(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, user, permissionRules, body, url, params } = request;

    const controller = context.getClass();
    const entity = entityForClass(controller);
    if (!entity) {
      this.logger.debug(
        'Entity doesnt assign to controller: ' + controller.name
      );
      return true;
    }

    if (!user) {
      this.logger.debug('User doesnt assign to request');
      return false;
    }

    if (!permissionRules) {
      this.logger.debug('Permission rules doesnt assign to request');
      return false;
    }

    if (!('name' in entity)) {
      this.logger.debug('Entity doesnt have name');
      return false;
    }

    checkInputHttpMethod(method);

    const action = MethodActionMap[method];
    const entityName = entity.name;

    const rulesForCurrentRequest = permissionRules.filter(
      (rule) => rule.action === action && rule.subject === entityName
    );
    if (rulesForCurrentRequest.length === 0) {
      this.logger.debug('No permission rules found for current request');
      return true;
    }

    switch (action) {
      case Actions.read:
      case Actions.update:
      case Actions.create:
      case Actions.delete:
    }
    return true;
  }
}
