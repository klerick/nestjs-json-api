import { Injectable, ParseIntPipe } from '@nestjs/common';
import { upperFirstLetter } from '@klerick/json-api-nestjs-shared';

import { PipeMixin } from '../../../types';
import { MixinOptions } from '../types';
import { nameIt } from '../helper';

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

export function factoryMixin(entity: MixinOptions['entity'], pipe: PipeMixin) {
  const entityName = entity.name;

  const pipeClass = nameIt(
    `${upperFirstLetter(entityName)}${pipe.name}`,
    pipe
  ) as PipeMixin;

  Injectable()(pipeClass);

  return pipeClass;
}

export function queryInputMixin(entity: MixinOptions['entity']): PipeMixin {
  return factoryMixin(entity, QueryInputPipe);
}

export function queryMixin(entity: MixinOptions['entity']): PipeMixin {
  return factoryMixin(entity, QueryPipe);
}

export function queryFiledInIncludeMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, QueryFiledInIncludePipe);
}

export function queryCheckSelectFieldMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, QueryCheckSelectField);
}

export function idPipeMixin(
  entity: MixinOptions['entity'],
  config?: MixinOptions['config']
): PipeMixin {
  return config && config.pipeForId ? config.pipeForId : (ParseIntPipe as any);
}

export function checkItemEntityPipeMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, CheckItemEntityPipe);
}

export function postInputPipeMixin(entity: MixinOptions['entity']): PipeMixin {
  return factoryMixin(entity, PostInputPipe);
}

export function patchInputPipeMixin(entity: MixinOptions['entity']): PipeMixin {
  return factoryMixin(entity, PatchInputPipe);
}

export function postRelationshipPipeMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PostRelationshipPipe);
}

export function patchRelationshipPipeMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, PatchRelationshipPipe);
}

export function parseRelationshipNamePipeMixin(
  entity: MixinOptions['entity']
): PipeMixin {
  return factoryMixin(entity, ParseRelationshipNamePipe);
}
