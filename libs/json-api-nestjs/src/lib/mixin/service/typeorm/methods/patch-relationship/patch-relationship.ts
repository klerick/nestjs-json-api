import {TypeormMixinService} from '../../typeorm.mixin';
import {ServiceOptions} from '../../../../../types';
import {Meta, Relationship} from '../../../../../types-common';

export async function patchRelationship<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>,
): Promise<{
  meta?: Partial<Meta>;
} & Relationship<T>>{

  const {route: {id, relName}, body} = options;

  const {rel, relationItem} = await this.UtilsMethode.validateRelationRequestData<T>(
    this.repository,
    id,
    relName,
    body,
  );
  const patchBuilder = this.repository.createQueryBuilder().relation(relName).of(id);

  if (['one-to-many', 'many-to-many'].includes(relationItem.relationType)) {
    const currentEntities = await patchBuilder.loadMany();
    const idsToDelete = currentEntities.map(entity => entity.id);
    const idsToAdd = body !== null ? rel.map(i => i.id) : [];
    await patchBuilder.addAndRemove(idsToAdd, idsToDelete);
  } else if (body !== null) {
    const { id } = Array.isArray(body) ? body.shift() : body;
    await patchBuilder.set(id);
  } else {
    await patchBuilder.set(null);
  }

  return {
    data:  body as Relationship<T>['data']
  }
}
