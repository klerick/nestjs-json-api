import { EntityRepository, Repository } from 'typeorm';

import { Users } from '../entities';

@EntityRepository(Users)
export class UsersRepository extends Repository<Users> {}
