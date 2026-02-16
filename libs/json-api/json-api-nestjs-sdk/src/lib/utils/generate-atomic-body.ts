import { Operation, RelationKeys } from '@klerick/json-api-nestjs-shared';

import { AtomicMainOperations, JsonApiSdkConfig, BodyType } from '../types';
import { getTypeForReq } from './utils';
import { JsonApiUtilsService } from '../service';

export type AtomicVoidOperation = {
  [K in keyof AtomicMainOperations<[]>]: (...arg: any) => void;
};

export class GenerateAtomicBody<
  Entity extends object = any,
  Rel extends RelationKeys<Entity> = any
> implements AtomicVoidOperation
{
  constructor(
    private jsonApiUtilsService: JsonApiUtilsService,
    private jsonApiSdkConfig: JsonApiSdkConfig
  ) {}
  private bodyData!: BodyType;
  private skipEmpty = true;

  get isSkipEmpty(): boolean {
    return this.skipEmpty;
  }

  private setToBody(
    op: Operation,
    entity: Entity,
    relationType?: Rel,
    meta?: Record<string, unknown>
  ) {
    const type = getTypeForReq(entity.constructor.name);

    const { relationships, attributes } =
      this.jsonApiUtilsService.generateBody(entity);
    const id = Reflect.get(entity, this.jsonApiSdkConfig.idKey);

    const idObj = op === 'add' && !relationType ? {} : { id: String(id) };
    const data = relationType
      ? this.jsonApiUtilsService.generateRelationshipsBody(
          entity[relationType] as any
        )
      : {
          type: getTypeForReq(entity.constructor.name),
          attributes,
          ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
          ...idObj,
        };

    const rel = relationType ? { relationship: String(relationType) } : {};
    const lid =
      op === 'add' && id && !relationType ? { lid: String(id) } : {};

    // IMPORTANT: Do NOT add meta for remove operation without relationship
    // zodRemove schema doesn't have meta field
    const shouldIncludeMeta = meta && !(op === 'remove' && !relationType);

    this.bodyData = {
      op,
      ref: { type, ...idObj, ...rel, ...lid },
      ...(op === 'remove' && !relationType ? {} : { data }),
      ...(shouldIncludeMeta ? { meta } : {}),
    };
  }

  getBody(): BodyType {
    return this.bodyData;
  }

  postOne(entity: Entity, meta?: Record<string, unknown>): void {
    this.setToBody(Operation.add, entity, undefined, meta);
  }
  patchOne(entity: Entity, meta?: Record<string, unknown>): void {
    if (Reflect.get(entity, this.jsonApiSdkConfig.idKey) === undefined) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    this.setToBody(Operation.update, entity, undefined, meta);
  }
  deleteOne(entity: Entity, skipEmpty: boolean): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }
    this.skipEmpty = skipEmpty;
    this.setToBody(Operation.remove, entity, undefined, undefined);
  }
  patchRelationships(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      new Error(`${relationType.toString()} should not be undefined in entity`);
    }
    this.setToBody(Operation.update, entity, relationType, meta);
  }
  postRelationships(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      throw new Error(
        `${relationType.toString()} should not be undefined in entity`
      );
    }
    this.setToBody(Operation.add, entity, relationType, meta);
  }
  deleteRelationships(
    entity: Entity,
    relationType: Rel,
    meta?: Record<string, unknown>
  ): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      throw new Error(
        `${relationType.toString()} should not be undefined in entity`
      );
    }
    this.setToBody(Operation.remove, entity, relationType, meta);
  }
}
