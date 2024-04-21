import { getPermissionRules } from './get-permission-rules.factory';
import { Actions, PermissionRule } from '../types';

describe('UserPermissionRulesService', () => {
  describe('getPermissionRules method', () => {
    it('should return a correct set of rules', () => {
      const mockPermissionRule: PermissionRule = {
        defaultRules: {
          subject1: {
            [Actions.create]: true,
            [Actions.delete]: true,
            [Actions.update]: true,
            [Actions.read]: true,
          },
        },
        customRules: {
          subject1: [
            {
              permission: 'can',
              condition: {
                id: '${currentUser.id}',
              },
              action: Actions.update,
            },
          ],
          subject2: [
            {
              permission: 'can',
              action: Actions.create,
            },
          ],
        },
      };
      const rules = getPermissionRules(mockPermissionRule);
      expect(rules).toEqual([
        { action: 'create', subject: 'subject1' },
        { action: 'delete', subject: 'subject1' },
        { action: 'update', subject: 'subject1' },
        { action: 'read', subject: 'subject1' },
        {
          action: 'update',
          subject: 'subject1',
          conditions: { id: '${currentUser.id}' },
        },
        { action: 'create', subject: 'subject2' },
      ]);
    });
  });
});
