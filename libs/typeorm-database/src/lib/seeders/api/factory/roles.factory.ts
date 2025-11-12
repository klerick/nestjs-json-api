import { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Roles } from '../../../entities';
import { BaseFactory } from '../../base-factory';

export class RolesFactory extends BaseFactory<Roles> {
  protected entity = Roles;
  protected rolesList = ['USERS', 'ADMIN', 'OTHER'];
  protected attrs(): FactorizedAttrs<Roles> {
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
