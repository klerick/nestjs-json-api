import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { QuerySchemaPipe } from './query-schema/query-schema.pipe';
import { QueryTransformPipe } from './query-transform/query-transform.pipe';
import { QueryTransformSchemaPipe } from './query-transform-schema/query-transform-schema.pipe';
import { QueryFiledInIncludePipe } from './query-filed-in-include/query-filed-in-include.pipe';
import { BodyInputPostPipe } from './body-input-post/body-input-post.pipe';
import { BodyInputPatchPipe } from './body-input-patch/body-input-patch.pipe';
import { ParseRelationshipNamePipe } from './parse-relationship-name/parse-relationship-name.pipe';
import { BodyRelationshipPipe } from './body-relationship/body-relationship.pipe';
import { BodyRelationshipPatchPipe } from './body-relationship-patch/body-relationship-patch.pipe';
import { Entity, PipeMixin } from '../../types';
import { nameIt } from '../../helper';

function factoryMixin(entity: Entity, connectionName: string, pipe: PipeMixin) {
  const entityName =
    entity instanceof Function ? entity.name : entity.options.name;

  const pipeClass = nameIt(
    `${
      entityName.charAt(0).toUpperCase() + entityName.slice(1)
    }QuerySchemaPipe`,
    pipe
  ) as PipeMixin;

  Injectable()(pipeClass);
  InjectRepository(entity, connectionName)(pipeClass, 'repository', 0);

  if (
    'inject' in pipeClass &&
    pipeClass['inject'] &&
    pipeClass['inject'] instanceof Function
  ) {
    pipeClass['inject'](pipeClass);
  }

  return pipeClass;
}

export function querySchemaMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QuerySchemaPipe);
}

export function queryTransformMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryTransformPipe);
}

export function queryTransformSchemaMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryTransformSchemaPipe);
}

export function queryFiledInIncludeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryFiledInIncludePipe);
}

export function bodyInputPostMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, BodyInputPostPipe);
}

export function bodyInputPatchPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, BodyInputPatchPipe);
}

export function parseRelationshipNameMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, ParseRelationshipNamePipe);
}

export function bodyRelationshipPipeMixin(): PipeMixin {
  return BodyRelationshipPipe;
}

export function bodyRelationshipPatchPipeMixin(): PipeMixin {
  return BodyRelationshipPatchPipe;
}
