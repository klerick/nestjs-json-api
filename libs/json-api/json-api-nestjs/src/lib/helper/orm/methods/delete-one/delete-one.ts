import { Entity, TypeormServiceObject } from '../../../../types';
import { FindOptionsWhere } from 'typeorm';

export async function deleteOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  id: number | string
): Promise<void> {
  const data = await this.repository.findOne({
    where: {
      [this.typeormUtilsService.currentPrimaryColumn.toString()]: id,
    } as FindOptionsWhere<E>,
  });
  if (!data) return void 0;

  this.config.useSoftDelete
    ? await this.repository.softRemove(data)
    : await this.repository.remove(data);

  return void 0;
}
