import { FactorizedAttrs, Factory } from '@jorgebodega/typeorm-factory';
import { DataSource, SaveOptions } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Roles } from '../../entities';
import { Promise } from 'ts-toolbelt/out/Any/Promise';

export class RolesFactory extends Factory<Roles> {
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

  constructor(protected dataSource: DataSource) {
    super();
  }
}
