import {
  ResponseRelationshipsObject,
  RequestRelationshipsData,
  ResponseResourceObject,
  RequestResourceData,
  QueryParams,
  RouteParams
} from '.';


export interface ServiceOptions<T> {
  route?: RouteParams;
  query?: QueryParams;
  body?: T;
}

export interface JsonApiService {
  getRelationship?(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<ResponseRelationshipsObject>;
  getOne?(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<ResponseResourceObject>;
  getAll?(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<ResponseResourceObject>;
  getDirectOne(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<ResponseResourceObject>;
  getDirectAll(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<ResponseResourceObject>;
  patchOne(
    this: JsonApiService,
    options: ServiceOptions<RequestResourceData>,
  ): Promise<ResponseResourceObject>;
  patchRelationship(
    this: JsonApiService,
    options: ServiceOptions<RequestRelationshipsData>,
  ): Promise<void>;
  postOne(
    this: JsonApiService,
    options: ServiceOptions<RequestResourceData>,
  ): Promise<ResponseResourceObject>;
  postRelationship(
    this: JsonApiService,
    options: ServiceOptions<RequestRelationshipsData>,
  ): Promise<void>;
  deleteOne(
    this: JsonApiService,
    options: ServiceOptions<void>,
  ): Promise<void>;
  deleteRelationship(
    this: JsonApiService,
    options: ServiceOptions<RequestRelationshipsData>,
  ): Promise<void>;
}
