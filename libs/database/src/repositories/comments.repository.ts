import { EntityRepository, Repository } from 'typeorm';

import { Comments } from '../entities';

@EntityRepository(Comments)
export class CommentsRepository extends Repository<Comments> {}
