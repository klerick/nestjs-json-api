import { FindOptionsWhere } from 'typeorm';
import { TypeOrmService } from '../../service';

export async function deleteOne<E extends object, IdKey extends string = 'id'>(
  this: TypeOrmService<E, IdKey>,
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
