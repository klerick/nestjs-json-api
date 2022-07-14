import { EntityRepository, Repository } from 'typeorm';
import { Pods } from '../entities';

@EntityRepository(Pods)
export class PodsRepository extends Repository<Pods>{}
