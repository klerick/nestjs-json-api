import { NotFoundException } from '@nestjs/common';
import {
  Entity,
  ResourceObject,
  TypeormServiceObject,
  ValidateQueryError,
} from '../../../../types';
import { Query } from '../../../zod';
import { ObjectTyped } from '../../../utils';

export async function getOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  id: number | string,
  query: Query<E>
): Promise<ResourceObject<E>> {
  const { include, fields } = query;
  const selectFields = new Set<string>();
  const builder = this.repository.createQueryBuilder(
    this.typeormUtilsService.currentAlias
  );

  if (fields) {
    selectFields.add(
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      )
    );

    const { target, ...other } = fields;
    if (target) {
      for (const fieldItem of target) {
        selectFields.add(this.typeormUtilsService.getAliasPath(fieldItem));
      }
    }

    for (const [rel, fieldRel] of ObjectTyped.entries(other)) {
      if (fieldRel) {
        for (const itemFieldRel of fieldRel) {
          selectFields.add(
            this.typeormUtilsService.getAliasPath(
              itemFieldRel,
              this.typeormUtilsService.getAliasForRelation(rel.toString())
            )
          );
        }
      }
    }
  }

  if (include) {
    for (const rel of include) {
      const currentIncludeAlias =
        this.typeormUtilsService.getAliasForRelation(rel);

      builder[fields ? 'leftJoin' : 'leftJoinAndSelect'](
        this.typeormUtilsService.getAliasPath(rel),
        currentIncludeAlias
      );

      if (fields) {
        selectFields.add(
          this.typeormUtilsService.getAliasPath(
            this.typeormUtilsService.getPrimaryColumnForRel(rel),
            currentIncludeAlias
          )
        );
      }
    }
  }
  if (selectFields.size > 0) {
    builder.select([...selectFields]);
  }
  const paramsId = 'paramsId';
  const result = await builder
    .where(
      `${this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      )} = :${paramsId}`,
      {
        [paramsId]: id,
      }
    )
    .getOne();

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }
  const { included, data } = this.transformDataService.transformData(result);
  return {
    meta: {},
    data,
    ...(included ? { included } : {}),
  };
}
