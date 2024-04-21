import { MongoAbility, MongoQuery, Subject } from '@casl/ability';

import { Method } from './request-types';

export enum Actions {
  read = 'read',
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface BaseRules {
  [Actions.read]: boolean;
  [Actions.create]: boolean;
  [Actions.update]: boolean;
  [Actions.delete]: boolean;
}

export type MethodActionMapType = { [key in Method]: Actions };

export interface MethodActionMap extends MethodActionMapType {
  [Method.GET]: Actions.read;
  [Method.POST]: Actions.create;
  [Method.PATCH]: Actions.update;
  [Method.DELETE]: Actions.delete;
}
type PermissionRuleAction = 'can' | 'cannot';
export interface CustomRules {
  action: Actions;
  permission: PermissionRuleAction;
  fields?: string[];
  // needRelation: string[];
  condition?: MongoQuery;
}

export type PermissionRule = {
  defaultRules: {
    [key: string]: BaseRules;
  };
  customRules?: {
    [key: string]: CustomRules[];
  };
};
export type Abilities = [Actions, Subject];

export type AbilityRules = MongoAbility<Abilities>;
