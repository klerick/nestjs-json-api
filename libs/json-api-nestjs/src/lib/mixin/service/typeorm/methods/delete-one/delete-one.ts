import { NotFoundException } from '@nestjs/common';

import { TypeormMixinService } from '../../typeorm.mixin';
import { ServiceOptions } from '../../../../../types';
import { snakeToCamel } from '../../../../../helper';

export async function deleteOne<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>
): Promise<void> {
  const preparedResourceName = snakeToCamel(this.repository.metadata.name);
  const { id } = options.route;

  const builder = this.repository.createQueryBuilder(preparedResourceName);
  builder.where({ id });

  const result = await builder.getOne();
  if (!result) {
    throw new NotFoundException({
      detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`,
    });
  }

  await this.repository
    .createQueryBuilder(preparedResourceName)
    .delete()
    .where({ id })
    .execute();
  return void 0;
}
