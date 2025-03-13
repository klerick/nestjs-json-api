import { NotFoundException } from '@nestjs/common';
import {
  RelationKeys,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { ValidateQueryError } from '@klerick/json-api-nestjs';
import { TypeOrmService } from '../../service';

export async function getRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: TypeOrmService<E, IdKey>,
  id: number | string,
  rel: Rel
): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
  const paramsId = 'paramsId';
  const result = (await this.repository
    .createQueryBuilder()
    .select([
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      ),
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.getPrimaryColumnForRel(rel as any),
        this.typeormUtilsService.getAliasForRelation(rel as any)
      ),
    ])
    .where(
      `
      ${this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      )} = :paramsId
    `
    )
    .leftJoin(
      this.typeormUtilsService.getAliasPath(rel.toString()),
      this.typeormUtilsService.getAliasForRelation(rel as any)
    )
    .setParameters({
      [paramsId]: id,
    })
    .getOne()) as E | null;

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }
  const data = this.transformDataService.transformRel(result, rel);

  return {
    meta: {},
    data,
  };
}
