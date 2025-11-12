import { NotFoundException } from '@nestjs/common';
import { ValidateQueryError, QueryOne } from '@klerick/json-api-nestjs';
import { ObjectTyped, ResourceObject } from '@klerick/json-api-nestjs-shared';
import { RelationAlias, TypeOrmService } from '../../service';
import {
  applyAclRulesToQueryBuilder,
  extractRelationsFromRules,
} from '../../orm-helper';

export async function getOne<E extends object, IdKey extends string>(
  this: TypeOrmService<E, IdKey>,
  id: number | string,
  query: QueryOne<E, IdKey>,
  transformData?: boolean,
  additionalQueryParams?: Record<string, unknown>
): Promise<ResourceObject<E, 'object', null, IdKey> | E> {
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
              this.typeormUtilsService.getAliasForRelation(
                rel as keyof RelationAlias<E>
              )
            )
          );
        }
      }
    }
  }

  if (include) {
    for (const relFromLoop of include) {
      const rel = relFromLoop as unknown as keyof RelationAlias<E>;
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
  builder.where(
    `${this.typeormUtilsService.getAliasPath(
      this.typeormUtilsService.currentPrimaryColumn
    )} = :${paramsId}`,
    {
      [paramsId]: id,
    }
  );

  if (additionalQueryParams) {

    // Extract relations from ACL rules
    const aclRelations = extractRelationsFromRules(
      additionalQueryParams,
      this.typeormUtilsService
    );

    // Add JOINs for ACL relations that aren't already in the query
    for (const rel of aclRelations) {
      const relationAlias = this.typeormUtilsService.getAliasForRelation(
        rel as any
      );

      // Check if this alias already exists in the query
      const aliasExists = builder.expressionMap.aliases.some(
        (alias) => alias.name === relationAlias
      );

      if (!aliasExists) {
        builder.leftJoin(
          this.typeormUtilsService.getAliasPath(rel as any),
          relationAlias
        );
      }
    }

    builder.andWhere(
      applyAclRulesToQueryBuilder(
        additionalQueryParams,
        this.typeormUtilsService
      )
    );
  }

  const result = await builder.getOne();

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }

  if (!transformData) return result;

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
