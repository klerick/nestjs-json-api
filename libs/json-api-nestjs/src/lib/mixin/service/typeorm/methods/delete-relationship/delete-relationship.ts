import {TypeormMixinService} from '../../typeorm.mixin';
import {ServiceOptions} from '../../../../../types';


export async function deleteRelationship<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>,
): Promise<void> {
  const {route: {id, relName}, body} = options;

  const {rel, relationItem} = await this.UtilsMethode.validateRelationRequestData<T>(
    this.repository,
    id,
    relName,
    body,
  );

  const deleteBuilder = this.repository.createQueryBuilder().relation(relName).of(id);
  if (['one-to-many', 'many-to-many'].includes(relationItem.relationType)) {
    await deleteBuilder.remove((rel).map(i => i.id));
  } else {
    await deleteBuilder.set(null);
  }
}
