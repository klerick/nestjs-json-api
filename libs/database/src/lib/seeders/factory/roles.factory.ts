import {FactorizedAttrs, Factory} from '@jorgebodega/typeorm-factory';
import {Roles} from '@nestjs-json-api/database';
import {DataSource} from 'typeorm';
import {faker} from '@faker-js/faker';

export class RolesFactory extends Factory<Roles> {
  protected entity = Roles;
  protected rolesList = ['USERS', 'ADMIN', 'OTHER']
  protected attrs(): FactorizedAttrs<Roles> {
    const key = faker.datatype.number(this.rolesList.length - 1);
    return {
      name: this.rolesList[key].toLowerCase(),
      key: this.rolesList[key]
    }
  }

  constructor(
    protected dataSource: DataSource,
  ) {
    super();
  }

}
