import {
  MethodName,
  Entity,
  TypeormService,
  EntityRelation,
  ResourceObject,
  ResourceObjectRelationships,
} from '../../types';
import {
  PostData,
  Query,
  PatchData,
  PostRelationshipData,
  PatchRelationshipData,
} from '../../helper';
import { TYPEORM_SERVICE_PROPS } from '../../constants';

type RequestMethodeObject = { [k in MethodName]: (...arg: any[]) => any };

interface IJsonBaseController extends RequestMethodeObject {}

export class JsonBaseController<E extends Entity>
  implements IJsonBaseController
{
  private [TYPEORM_SERVICE_PROPS]!: TypeormService<E>;

  getOne(id: string | number, query: Query<E>): Promise<ResourceObject<E>> {
    return this[TYPEORM_SERVICE_PROPS].getOne(id, query);
  }
  getAll(query: Query<E>): Promise<ResourceObject<E, 'array'>> {
    return this[TYPEORM_SERVICE_PROPS].getAll(query);
  }
  deleteOne(id: string | number): Promise<void> {
    return this[TYPEORM_SERVICE_PROPS].deleteOne(id);
  }

  patchOne(
    id: string | number,
    inputData: PatchData<E>
  ): Promise<ResourceObject<E>> {
    return this[TYPEORM_SERVICE_PROPS].patchOne(id, inputData);
  }

  postOne(inputData: PostData<E>): Promise<ResourceObject<E>> {
    return this[TYPEORM_SERVICE_PROPS].postOne(inputData);
  }

  getRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[TYPEORM_SERVICE_PROPS].getRelationship(id, relName);
  }
  postRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[TYPEORM_SERVICE_PROPS].postRelationship(id, relName, input);
  }

  deleteRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PostRelationshipData
  ): Promise<void> {
    return this[TYPEORM_SERVICE_PROPS].deleteRelationship(id, relName, input);
  }

  patchRelationship<Rel extends EntityRelation<E>>(
    id: string | number,
    relName: Rel,
    input: PatchRelationshipData
  ): Promise<ResourceObjectRelationships<E, Rel>> {
    return this[TYPEORM_SERVICE_PROPS].patchRelationship(id, relName, input);
  }
}
