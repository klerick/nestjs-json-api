import { MicroOrmService } from '../../service';
import { FilterQuery } from '@mikro-orm/core';

export async function deleteOne<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  id: number | string
): Promise<void> {
  const data = await this.microOrmUtilService.entityManager.findOne(
    this.microOrmUtilService.entity,
    {
      [this.microOrmUtilService.currentPrimaryColumn]: id,
    } as FilterQuery<NoInfer<E>>
  );

  if (!data) return void 0;

  await this.microOrmUtilService.entityManager.remove(data).flush();

  return void 0;
}
