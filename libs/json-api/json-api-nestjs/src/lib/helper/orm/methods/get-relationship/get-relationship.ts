import {
  Entity,
  TypeormServiceObject,
  EntityRelation,
  ValidateQueryError,
  ResourceObjectRelationships,
} from '../../../../types';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export async function getRelationship<
  E extends Entity,
  Rel extends EntityRelation<E>
>(
  this: TypeormServiceObject<E>,
  id: number | string,
  rel: Rel
): Promise<ResourceObjectRelationships<E, Rel>> {
  const paramsId = 'paramsId';
  const result = await this.repository
    .createQueryBuilder()
    .select([
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      ),
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.getPrimaryColumnForRel(rel.toString()),
        this.typeormUtilsService.getAliasForRelation(rel.toString())
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
      this.typeormUtilsService.getAliasForRelation(rel.toString())
    )
    .setParameters({
      [paramsId]: id,
    })
    .getOne();

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }

  const { data } = this.transformDataService.getRelationships<Rel>(result, rel);
  if (data === undefined) {
    const error: ValidateQueryError = {
      code: 'custom',
      message: `transformDataService.getRelationships return undefined`,
      path: [],
    };
    throw new InternalServerErrorException([error]);
  }
  return {
    meta: {},
    data,
  };
}
