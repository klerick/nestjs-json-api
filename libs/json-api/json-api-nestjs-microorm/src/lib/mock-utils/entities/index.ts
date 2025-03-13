export * from './users';
export * from './roles';
export * from './comments';
export * from './addresses';
export * from './user-groups';
export * from './notes';

import { Users } from './users';
import { Roles } from './roles';
import { Comments } from './comments';
import { Addresses } from './addresses';
import { UserGroups } from './user-groups';
import { Notes } from './notes';

export const Entities = [Users, Roles, Comments, Addresses, UserGroups, Notes];
