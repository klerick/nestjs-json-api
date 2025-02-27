import { MicroOrmService } from '../../service';

export async function deleteOne<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
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
