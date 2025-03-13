import { Observable } from 'rxjs';
import {
  KEY_MAIN_INPUT_SCHEMA,
  KEY_MAIN_OUTPUT_SCHEMA,
  RelationKeys,
} from '@klerick/json-api-nestjs-shared';
import { map } from 'rxjs/operators';

import { GenerateAtomicBody } from '../utils';
import { JsonApiUtilsService } from './json-api-utils.service';

import {
  AtomicBody,
  AtomicOperations,
  HttpInnerClient,
  JsonApiSdkConfig,
  ReturnIfArray,
  AtomicVoidOperation,
} from '../types';

type GetTypeBody<T extends unknown[]> = {
  [K in keyof T[number]]: GenerateAtomicBody<T>;
}[keyof T[number]];

export class AtomicOperationsService<T extends unknown[]>
  implements AtomicOperations<T>
{
  private generateAtomicBody: GetTypeBody<T>[] = [];

  constructor(
    private jsonApiUtilsService: JsonApiUtilsService,
    private jsonApiSdkConfig: JsonApiSdkConfig,
    private httpInnerClient: HttpInnerClient
  ) {}

  private addBody(item: GenerateAtomicBody) {
    this.generateAtomicBody.push(item);
  }

  public run(): Observable<T> {
    if (!this.jsonApiSdkConfig.operationUrl) {
      throw new Error('Should be set operation url');
    }

    const atomicBody = this.generateAtomicBody.map((i) => i.getBody());
    const body = {
      [KEY_MAIN_INPUT_SCHEMA]: atomicBody,
    } as AtomicBody;
    const bodyWithoutDelete = atomicBody.filter((i) => i.op !== 'remove');
    const operationUrl = this.jsonApiUtilsService.getUrlForResource(
      this.jsonApiSdkConfig.operationUrl
    );

    const indexDeleteIfNotSkipEmpty = atomicBody
      .reduce<number[]>((acum, item, index) => {
        if (
          item.op === 'remove' &&
          !this.generateAtomicBody[index].isSkipEmpty
        ) {
          acum.push(index);
        }
        return acum;
      }, [])
      .sort((a, b) => a - b);
    return this.httpInnerClient.post<T>(operationUrl, body).pipe(
      map((r) => r[KEY_MAIN_OUTPUT_SCHEMA]),
      map(
        (r) =>
          r.map((item, index) =>
            bodyWithoutDelete[index].ref.relationship
              ? this.jsonApiUtilsService.getResultForRelation(item)
              : this.jsonApiUtilsService.convertResponseData(item)
          ) as T
      ),
      map((r) =>
        indexDeleteIfNotSkipEmpty.reduce(
          (acc, index, currentIndex) => {
            acc.splice(index + currentIndex, 0, 'EMPTY');
            return acc;
          },
          [...r] as T
        )
      )
    );
  }

  deleteOne<Entity extends object>(entity: Entity): AtomicOperations<[...T]>;
  deleteOne<Entity extends object>(
    entity: Entity,
    skipEmpty: true
  ): AtomicOperations<[...T]>;
  deleteOne<Entity extends object>(
    entity: Entity,
    skipEmpty: false
  ): AtomicOperations<[...T, 'EMPTY']>;
  deleteOne<Entity extends object>(
    entity: Entity,
    skipEmpty?: boolean
  ): AtomicOperations<[...T, 'EMPTY'] | [...T]> {
    return this.setToBody(
      'deleteOne',
      entity,
      skipEmpty === undefined ? true : skipEmpty
    );
  }

  public patchOne<Entity extends object>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]> {
    return this.setToBody('patchOne', entity);
  }

  public postOne<Entity extends object>(
    entity: Entity
  ): AtomicOperations<[...T, Entity]> {
    return this.setToBody('postOne', entity);
  }

  public deleteRelationships<
    Entity extends object,
    Rel extends RelationKeys<Entity>
  >(entity: Entity, relationType: Rel): AtomicOperations<T> {
    return this.setToBody('deleteRelationships', entity, relationType);
  }

  public patchRelationships<
    Entity extends object,
    Rel extends RelationKeys<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]> {
    return this.setToBody('patchRelationships', entity, relationType);
  }

  public postRelationships<
    Entity extends object,
    Rel extends RelationKeys<Entity>
  >(
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]> {
    return this.setToBody('postRelationships', entity, relationType);
  }

  private setToBody<Entity extends object>(
    operationType: Extract<keyof AtomicVoidOperation, 'deleteOne'>,
    entity: Entity
  ): AtomicOperations<T>;
  private setToBody<Entity extends object>(
    operationType: Extract<keyof AtomicVoidOperation, 'deleteOne'>,
    entity: Entity,
    skipEmpty: boolean
  ): AtomicOperations<[...T, 'EMPTY']>;
  private setToBody<Entity extends object>(
    operationType: Exclude<keyof AtomicVoidOperation, 'deleteOne'>,
    entity: Entity
  ): AtomicOperations<[...T, Entity]>;
  private setToBody<Entity extends object, Rel extends RelationKeys<Entity>>(
    operationType: Extract<keyof AtomicVoidOperation, 'deleteRelationships'>,
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<T>;
  private setToBody<Entity extends object, Rel extends RelationKeys<Entity>>(
    operationType: Exclude<keyof AtomicVoidOperation, 'deleteRelationships'>,
    entity: Entity,
    relationType: Rel
  ): AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>;
  private setToBody<Entity extends object, Rel extends RelationKeys<Entity>>(
    operationType: keyof AtomicVoidOperation,
    entity: Entity,
    relationType?: Rel | boolean
  ):
    | AtomicOperations<[...T, Entity]>
    | AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>
    | AtomicOperations<[...T]>
    | AtomicOperations<[...T, 'EMPTY']> {
    const atomicBody = new GenerateAtomicBody<Entity, Rel>(
      this.jsonApiUtilsService,
      this.jsonApiSdkConfig
    );

    if (typeof relationType === 'boolean') {
      if (operationType === 'deleteOne') {
        atomicBody[operationType](entity, relationType);
      }
    } else {
      switch (operationType) {
        case 'postRelationships':
        case 'patchRelationships':
        case 'deleteRelationships':
          if (relationType) atomicBody[operationType](entity, relationType);
          break;
        default:
          atomicBody[operationType](entity, true);
          break;
      }
    }

    this.addBody(atomicBody);

    return this as unknown as
      | AtomicOperations<[...T, Entity]>
      | AtomicOperations<[...T, ReturnIfArray<Entity[Rel], string>]>
      | AtomicOperations<T>
      | AtomicOperations<[...T, 'EMPTY']>;
  }
}
