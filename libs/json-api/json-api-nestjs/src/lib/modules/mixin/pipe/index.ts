import { Injectable, ParseIntPipe } from '@nestjs/common';
import { pascalCase } from 'change-case-commonjs';

import { ModuleMixinOptions, PipeMixin } from '../../../types';

import { QueryInputPipe } from './query-input';
import { QueryPipe } from './query';
import { QueryFiledInIncludePipe } from './query-filed-on-include';
import { QueryCheckSelectField } from './query-check-select-field';
import { CheckItemEntityPipe } from './check-item-entity';
import { PostInputPipe } from './post-input';
import { PatchInputPipe } from './patch-input';
import { ParseRelationshipNamePipe } from './parse-relationship-name';
import { PostRelationshipPipe } from './post-relationship';
import { PatchRelationshipPipe } from './patch-relationship';
import { nameIt } from '../helpers';
import { EntityControllerParam } from '../types';

export function factoryMixin(
  entity: ModuleMixinOptions['entity'],
  pipe: PipeMixin
) {
  const entityName = entity.name;

  const pipeClass = nameIt(
    `${pascalCase(entityName)}${pipe.name}`,
    pipe
  ) as PipeMixin;

  Injectable()(pipeClass);

  return pipeClass;
}

export function queryInputMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, QueryInputPipe);
}

export function queryMixin(entity: ModuleMixinOptions['entity']): PipeMixin {
  return factoryMixin(entity, QueryPipe);
}

export function queryFiledInIncludeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, QueryFiledInIncludePipe);
}

export function queryCheckSelectFieldMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, QueryCheckSelectField);
}

export function idPipeMixin(
  entity: ModuleMixinOptions['entity'],
  config?: EntityControllerParam
): PipeMixin {
  return config && config.pipeForId ? config.pipeForId : (ParseIntPipe as any);
}

export function checkItemEntityPipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, CheckItemEntityPipe);
}

export function postInputPipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PostInputPipe);
}

export function patchInputPipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PatchInputPipe);
}

export function postRelationshipPipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PostRelationshipPipe);
}

export function patchRelationshipPipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PatchRelationshipPipe);
}

export function parseRelationshipNamePipeMixin(
  entity: ModuleMixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, ParseRelationshipNamePipe);
}
