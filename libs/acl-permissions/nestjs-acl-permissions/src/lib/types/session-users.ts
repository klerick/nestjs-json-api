import { Express } from 'express-serve-static-core';
import { RawRuleOf } from '@casl/ability';

import { AbilityRules } from './acl';

declare module 'express-serve-static-core' {
  interface User {}
  interface Request {
    user?: User;
    permissionRules: RawRuleOf<AbilityRules>[];
  }
}
