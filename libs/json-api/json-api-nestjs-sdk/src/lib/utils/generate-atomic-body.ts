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

  private setToBody(op: Operation, entity: Entity, relationType?: Rel) {
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
    const tmpId =
      op === 'add' && id && !relationType ? { tmpId: String(id) } : {};
    if (op === 'add' && id && !relationType) {
      idObj['id'] = String(id);
    }
    this.bodyData = {
      op,
      ref: { type, ...idObj, ...rel, ...tmpId },
      ...(op === 'remove' && !relationType ? {} : { data }),
    };
  }

  getBody(): BodyType {
    return this.bodyData;
  }

  postOne(entity: Entity): void {
    this.setToBody(Operation.add, entity);
  }
  patchOne(entity: Entity): void {
    if (Reflect.get(entity, this.jsonApiSdkConfig.idKey) === undefined) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    this.setToBody(Operation.update, entity);
  }
  deleteOne(entity: Entity, skipEmpty: boolean): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }
    this.skipEmpty = skipEmpty;
    this.setToBody(Operation.remove, entity);
  }
  patchRelationships(entity: Entity, relationType: Rel): void {
    if (!Reflect.get(entity, this.jsonApiSdkConfig.idKey)) {
      throw new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      new Error(`${relationType.toString()} should not be undefined in entity`);
    }
    this.setToBody(Operation.update, entity, relationType);
  }
  postRelationships(entity: Entity, relationType: Rel): void {
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
    this.setToBody(Operation.add, entity, relationType);
  }
  deleteRelationships(entity: Entity, relationType: Rel): void {
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
    this.setToBody(Operation.remove, entity, relationType);
  }
}
