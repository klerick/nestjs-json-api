import {
  PipeTransform,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';
import { TypeormUtilsService } from '../../service/typeorm-utils.service';
import { Entity, EntityRelation, ValidateQueryError } from '../../../types';

export class ParseRelationshipNamePipe<E extends Entity>
  implements PipeTransform<string, EntityRelation<E>>
{
  @Inject(TypeormUtilsService)
  private typeormUtilsService!: TypeormUtilsService<E>;

  transform(value: string): EntityRelation<E> {
    this.checkRelName(value);
    return value;
  }

  checkRelName(value: unknown): asserts value is EntityRelation<E> {
    if (!this.typeormUtilsService.relationFields.find((i) => i === value)) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        message: `Relation '${value}' does not exist in resource '${this.typeormUtilsService.currentAlias}'`,
        path: [],
      };
      throw new UnprocessableEntityException([error]);
    }
  }
}
