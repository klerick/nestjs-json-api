import { EntityRepository, Repository } from 'typeorm';

import { Roles } from '../entities';

@EntityRepository(Roles)
export class RolesRepository extends Repository<Roles> {}
