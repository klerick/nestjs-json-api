import { PipeTransform, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { snakeToCamel, getEntityName } from '../../../helper';

export class ParseRelationshipNamePipe<Entity> implements PipeTransform {
  constructor(protected repository: Repository<Entity>) {}

  transform(value: string): string {
    const relation = this.repository.metadata.relations.find((relation) => {
      return relation.propertyPath === value;
    });

    if (!relation) {
      const name = snakeToCamel(getEntityName(this.repository.target));
      throw new BadRequestException([
        {
          detail: `Relation '${value}' does not exist in resource '${name}'`,
        },
      ]);
    }

    return value;
  }
}
