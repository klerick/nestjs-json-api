import { MicroOrmService } from '../../service';
import { ObjectLiteral } from '../../../../types';

export async function deleteOne<E extends ObjectLiteral>(
  this: MicroOrmService<E>,
  id: number | string
): Promise<void> {
  const data = await this.microOrmUtilService
    .queryBuilder()
    .where({
      [this.microOrmUtilService.currentPrimaryColumn]: id,
    })
    .getSingleResult();

  if (!data) return void 0;

  await this.microOrmUtilService.entityManager.removeAndFlush(data);

  return void 0;
}
