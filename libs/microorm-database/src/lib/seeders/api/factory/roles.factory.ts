import { Factory } from '@mikro-orm/seeder';
import { Roles } from '../../../entities';

export class RolesFactory extends Factory<Roles> {
  model = Roles;
  protected rolesList = ['USERS', 'ADMIN', 'OTHER'];
  definition(): Partial<Roles> {
    const role = this.rolesList.shift();
    if (!role) {
      throw new Error('Role is empty');
    }
    return {
      name: role.toLowerCase(),
      key: role,
    };
  }
}
