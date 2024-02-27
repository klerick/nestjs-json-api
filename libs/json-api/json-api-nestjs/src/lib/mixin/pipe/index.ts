import { Injectable, ParseIntPipe } from '@nestjs/common';

import { QueryPipe } from './query';
import { QueryInputPipe } from './query-input';
import { QueryFiledInIncludePipe } from './query-filed-on-include';
import { QueryCheckSelectField } from './query-check-select-field';

import { ConfigParam, Entity, PipeMixin } from '../../types';
import { nameIt } from '../../helper';
import { CheckItemEntityPipe } from './check-item-entity';
import { PostInputPipe } from './post-input';
import { PatchInputPipe } from './patch-input';
import { PostRelationshipPipe } from './post-relationship';
import { ParseRelationshipNamePipe } from './parse-relationship-name';
import { PatchRelationshipPipe } from './patch-relationship';

function factoryMixin(entity: Entity, connectionName: string, pipe: PipeMixin) {
  const entityName =
    entity instanceof Function ? entity.name : entity['options'].name;

  const pipeClass = nameIt(
    `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}${pipe.name}`,
    pipe
  ) as PipeMixin;

  Injectable()(pipeClass);

  return pipeClass;
}

export function queryInputMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryInputPipe);
}

export function queryMixin(entity: Entity, connectionName: string): PipeMixin {
  return factoryMixin(entity, connectionName, QueryPipe);
}

export function queryFiledInIncludeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryFiledInIncludePipe);
}

export function queryCheckSelectFieldMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, QueryCheckSelectField);
}

export function idPipeMixin(
  entity: Entity,
  connectionName: string,
  config?: ConfigParam
): PipeMixin {
  return config && config.pipeForId ? config.pipeForId : ParseIntPipe;
}

export function checkItemEntityPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, CheckItemEntityPipe);
}
export function postInputPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, PostInputPipe);
}

export function patchInputPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, PatchInputPipe);
}

export function postRelationshipPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, PostRelationshipPipe);
}

export function patchRelationshipPipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, PatchRelationshipPipe);
}
export function parseRelationshipNamePipeMixin(
  entity: Entity,
  connectionName: string
): PipeMixin {
  return factoryMixin(entity, connectionName, ParseRelationshipNamePipe);
}
