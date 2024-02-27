import { Inject, NotFoundException, PipeTransform } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CURRENT_ENTITY_REPOSITORY } from '../../../constants';
import { Entity, ValidateQueryError } from '../../../types';
import { TypeormUtilsService } from '../../service/typeorm-utils.service';

export class CheckItemEntityPipe<E extends Entity, I = string | number>
  implements PipeTransform<I, Promise<I>>
{
  @Inject(CURRENT_ENTITY_REPOSITORY) private repository!: Repository<E>;
  @Inject(TypeormUtilsService)
  private typeormUtilsService!: TypeormUtilsService<E>;
  async transform(value: I): Promise<I> {
    const params = 'params';
    const result = await this.repository
      .createQueryBuilder(this.typeormUtilsService.currentAlias)
      .where(
        `${this.typeormUtilsService.getAliasPath(
          this.typeormUtilsService.currentPrimaryColumn
        )} = :${params}`
      )
      .setParameters({
        [params]: value,
      })
      .getOne();
    if (!result) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${value}' does not exist`,
        path: [],
      };
      throw new NotFoundException([error]);
    }
    return value;
  }
}
