export * from './users';
export * from './roles';
export * from './requests-have-pod-locks';
export * from './requests';
export * from './pods';
export * from './comments';
export * from './addresses';
export * from './user-groups';
export * from './notes';

import { Users } from './users';
import { Roles } from './roles';
import { Requests } from './requests';
import { Pods } from './pods';
import { Comments } from './comments';
import { Addresses } from './addresses';
import { UserGroups } from './user-groups';
import { Notes } from './notes';

export const Entities = [
  Users,
  Roles,
  Requests,
  Pods,
  Comments,
  Addresses,
  UserGroups,
  Notes,
];
