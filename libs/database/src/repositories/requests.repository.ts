import { EntityRepository, Repository } from 'typeorm';
import { Requests } from '../entities';

@EntityRepository(Requests)
export class RequestsRepository extends Repository<Requests>{}
