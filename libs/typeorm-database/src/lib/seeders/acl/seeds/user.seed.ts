import { UserProfileFactory, UsersAclFactory } from '../factory';
import { UserRole } from '../../../entities';
import { AclContext } from '../acl.seed';
import { BaseSeeder } from '../../base-seeder';
import { DataSource } from 'typeorm';
import { SingleSubfactory } from '@jorgebodega/typeorm-factory';


export class UsersSeed extends BaseSeeder {
  async run(dataSource: DataSource, context: AclContext) {
    const userFactory = new UsersAclFactory(dataSource);
    const profileFactory = new UserProfileFactory(dataSource);

    const usersArray: string[] = [
      'inactive',
      'alice',
      'bob',
      'charlie',
      'admin',
      'moderator',
    ];

    const profileData: {
      role: UserRole;
      isPublic?: boolean;
    }[] = [
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
        user.profile = new SingleSubfactory(profileFactory, {
          ...profileData.shift(),
          ...(user.login === 'bob' ? { isPublic: false } : {}),
          firstName: user.firstName as string,
          lastName: user.lastName as string,
        });

        user.isActive = activeUser;
        activeUser = !activeUser;
      })
      .createMany(count);
  }
}
