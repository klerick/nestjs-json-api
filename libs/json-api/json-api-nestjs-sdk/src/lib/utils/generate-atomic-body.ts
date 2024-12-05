import {
  AtomicMainOperations,
  Entity as EntityObject,
  EntityRelation,
  JsonApiSdkConfig,
} from '../types';
import { getTypeForReq } from './';
import { JsonApiUtilsService } from '../service';

export enum Operation {
  add = 'add',
  update = 'update',
  remove = 'remove',
}

export type BodyType = {
  op: Operation;
  ref: {
    type: string;
    id?: string;
    relationship?: string;
    tmpId?: string;
  };
  data?: any;
};

export type AtomicVoidOperation = {
  [K in keyof AtomicMainOperations<[]>]: (...arg: any) => void;
};

export class GenerateAtomicBody<
  Entity extends EntityObject = any,
  Rel extends EntityRelation<Entity> = any
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

    const idObj =
      op === 'add' && !relationType
        ? {}
        : { id: entity[this.jsonApiSdkConfig.idKey].toString() };
    const data = relationType
      ? this.jsonApiUtilsService.generateRelationshipsBody<
          Entity[EntityRelation<Entity>]
        >(entity[relationType])
      : {
          type: getTypeForReq(entity.constructor.name),
          attributes,
          ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
          ...idObj,
        };

    const rel = relationType ? { relationship: String(relationType) } : {};
    const tmpId =
      op === 'add' && entity[this.jsonApiSdkConfig.idKey] && !relationType
        ? { tmpId: entity[this.jsonApiSdkConfig.idKey] }
        : {};
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
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    this.setToBody(Operation.update, entity);
  }
  deleteOne(entity: Entity, skipEmpty: boolean): void {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      new Error(
        'Resource params should be instance of resource with id params'
      );
    }
    this.skipEmpty = skipEmpty;
    this.setToBody(Operation.remove, entity);
  }
  patchRelationships(entity: Entity, relationType: Rel): void {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      new Error(`${relationType.toString()} should not be undefined in entity`);
    }
    this.setToBody(Operation.update, entity, relationType);
  }
  postRelationships(entity: Entity, relationType: Rel): void {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      new Error(`${relationType.toString()} should not be undefined in entity`);
    }
    this.setToBody(Operation.add, entity, relationType);
  }
  deleteRelationships(entity: Entity, relationType: Rel): void {
    if (!entity[this.jsonApiSdkConfig.idKey]) {
      new Error(
        'Resource params should be instance of resource with id params'
      );
    }

    if (entity[relationType] === undefined) {
      new Error(`${relationType.toString()} should not be undefined in entity`);
    }
    this.setToBody(Operation.remove, entity, relationType);
  }
}
