import { NotFoundException } from '@nestjs/common';
import { ValidateQueryError, QueryOne } from '@klerick/json-api-nestjs';
import { ObjectTyped, ResourceObject } from '@klerick/json-api-nestjs-shared';
import { TypeOrmService } from '../../service';

export async function getOne<E extends object, IdKey extends string>(
  this: TypeOrmService<E, IdKey>,
  id: number | string,
  query: QueryOne<E, IdKey>
): Promise<ResourceObject<E, 'object', null, IdKey>> {
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

    const { target, ...other } = fields as any;
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
              this.typeormUtilsService.getAliasForRelation(rel as any)
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
  const { included, data } = this.transformDataService.transformData(
    result,
    query
  );
  return {
    meta: {},
    data,
    ...(included ? { included } : {}),
  };
}
