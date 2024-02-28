import { Entity, TypeormServiceObject } from '../../../../types';

export async function deleteOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  id: number | string
): Promise<void> {
  await this.repository
    .createQueryBuilder(this.typeormUtilsService.currentAlias)
    .delete()
    .where(
      `${this.typeormUtilsService.currentPrimaryColumn.toString()} = :params`
    )
    .setParameters({
      params: id,
    })
    .execute();
  return void 0;
}
