import { TypeormMixinService } from '../../typeorm.mixin';
import { ServiceOptions } from '../../../../../types';
import { Meta, Relationship } from '../../../../../types-common';

export async function postRelationship<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>
): Promise<
  {
    meta?: Partial<Meta>;
  } & Relationship<T>
> {
  const {
    route: { id, relName },
    body,
  } = options;

  const { rel, relationItem } =
    await this.UtilsMethode.validateRelationRequestData<T>(
      this.repository,
      id,
      relName,
      body
    );
  const postBuilder = this.repository
    .createQueryBuilder()
    .relation(relName)
    .of(id);

  if (['one-to-many', 'many-to-many'].includes(relationItem.relationType)) {
    await postBuilder.add(rel.map((i) => i.id));
  } else {
    const { id } = Array.isArray(rel) ? rel.shift() : rel;
    await postBuilder.set(id);
  }

  return {
    data: body as Relationship<T>['data'],
  };
}
