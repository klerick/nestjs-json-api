import {
  EntityRelation,
  ResourceObject,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';

import { ORM_SERVICE_PROPS } from '../../../constants';
import { MethodName } from '../types';
import { ObjectLiteral } from '../../../types';
import {
  PatchData,
  PatchRelationshipData,
  PostData,
  PostRelationshipData,
  Query,
  QueryOne,
} from '../zod';
import { OrmService } from '../types';

type RequestMethodeObject<E extends ObjectLiteral> = {
  [K in MethodName]: OrmService<E>[K];
};

export class JsonBaseController<E extends ObjectLiteral>
  implements RequestMethodeObject<E>
{
  private [ORM_SERVICE_PROPS]!: OrmService<E>;

  getOne(id: string | number, query: QueryOne<E>): Promise<ResourceObject<E>> {
    return this[ORM_SERVICE_PROPS].getOne(id, query);
  }
  getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>> {
    return this[ORM_SERVICE_PROPS].getAll(query);
  }
  deleteOne(id: string | number): Promise<void> {
    return this[ORM_SERVICE_PROPS].deleteOne(id);
  }

  patchOne(
    id: string | number,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>> {
    return this[ORM_SERVICE_PROPS].patchOne(id, inputData);
  }

  postOne(inputData: PostData<E>): Promise<ResourceObject<E>> {
    return this[ORM_SERVICE_PROPS].postOne(inputData);
  }

  getRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[ORM_SERVICE_PROPS].getRelationship(id, relName);
  }
  postRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[ORM_SERVICE_PROPS].postRelationship(id, relName, input);
  }

  deleteRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    return this[ORM_SERVICE_PROPS].deleteRelationship(id, relName, input);
  }

  patchRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[ORM_SERVICE_PROPS].patchRelationship(id, relName, input);
  }
}
