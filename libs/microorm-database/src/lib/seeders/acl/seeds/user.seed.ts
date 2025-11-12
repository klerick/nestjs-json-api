import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserProfileFactory, UsersAclFactory } from '../factory';
import { UserRole, UserProfileAcl, UsersAcl } from '../../../entities';
import type { EntityData } from '@mikro-orm/core';
import { AclContext } from '../acl.seed';

export class UsersSeed extends Seeder {
  async run(em: EntityManager, context: AclContext) {
    const userFactory = new UsersAclFactory(em);
    const profileFactory = new UserProfileFactory(em);

    const usersArray: string[] = [
      'inactive',
      'alice',
      'bob',
      'charlie',
      'admin',
      'moderator',
    ];

    const profileData: EntityData<UserProfileAcl>[] = [
      ...new Array(4).fill(null).map((_, i, array) => ({
        role: UserRole.user,
        isPublic: i !== array.length - 1,
      })),
      { role: UserRole.admin },
      { role: UserRole.moderator },
    ];
    const count = profileData.length;
    let activeUser = false;
    context.aclContext.users = await userFactory
      .each((user) => {
        user.login = usersArray.shift() as string;
        user.profile = profileFactory.makeOne({
          ...profileData.shift(),
          ...(user.login === 'bob' ? { isPublic: false } : { }),
          firstName: user.firstName,
          lastName: user.lastName,
        });
        user.isActive = activeUser;
        activeUser = !activeUser;
      })
      .create(count);
  }
}
