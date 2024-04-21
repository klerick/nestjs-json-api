import { AbilityBuilder, createMongoAbility, RawRuleOf } from '@casl/ability';
import { ValueProvider } from '@nestjs/common';

import { AbilityRules, Actions, PermissionRule } from '../types';
import { GET_PERMISSION_RULES } from '../constants';

export function getPermissionRules(
  permission: PermissionRule
): RawRuleOf<AbilityRules>[] {
  const abilityBuilder = new AbilityBuilder<AbilityRules>(createMongoAbility);

  const defaultRules = Object.entries(permission.defaultRules).reduce<
    Required<PermissionRule>['customRules']
  >((acum, [subject, rules]) => {
    acum[subject] = Object.entries(rules).map(([action, permission]) => ({
      permission: permission ? 'can' : 'cannot',
      action: action as Actions,
    }));
    return acum;
  }, {});

  const resultRules = Object.entries(permission.customRules || {}).reduce(
    (acum, [subject, rules]) => {
      if (!acum[subject]) {
        acum[subject] = [...rules];
      } else {
        acum[subject].push(...rules);
      }
      acum[subject] = acum[subject] || [...rules];
      return acum;
    },
    defaultRules
  );

  for (const [subject, rules] of Object.entries(resultRules)) {
    for (const { permission, fields, action, condition } of rules) {
      abilityBuilder[permission](action, subject, fields, condition);
    }
  }

  return abilityBuilder.build().rules;
}

export type GetPermissionRules = typeof getPermissionRules;

export const getPermissionRulesFactory: ValueProvider<GetPermissionRules> = {
  provide: GET_PERMISSION_RULES,
  useValue: getPermissionRules,
};
