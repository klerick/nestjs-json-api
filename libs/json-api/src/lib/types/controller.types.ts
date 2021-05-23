import {
  RequestRelationshipsData,
  RequestResourceData,
  JsonApiService,
  QueryParams
} from '.';

export type controllerMethod =
  getOneMethod |
  getAllMethod |
  getDirectOneMethod |
  getDirectAllMethod |
  getRelationshipMethod |
  patchOneMethod |
  patchRelationshipMethod |
  postOneMethod |
  postRelationshipMethod |
  deleteOneMethod |
  deleteRelationshipMethod;

export type getOneMethod = (
  this: JsonApiController,
  id: number,
  params: QueryParams,
  ...rest: any[]
) => Promise<any>;

export type getAllMethod = (
  this: JsonApiController,
  query: QueryParams,
  ...rest: any[]
) => Promise<any>;

export type getDirectOneMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  relId: number,
  params: QueryParams,
  ...rest: any[]
) => Promise<any>;

export type getDirectAllMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  params: QueryParams,
  ...rest: any[]
) => Promise<any>;

export type getRelationshipMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  ...rest: any[]
) => Promise<any>;

export type patchOneMethod = (
  this: JsonApiController,
  id: number,
  body: RequestResourceData,
  ...rest: any[]
) => Promise<any>;

export type patchRelationshipMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  body: RequestRelationshipsData,
  ...rest: any[]
) => Promise<void>;

export type postOneMethod = (
  this: JsonApiController,
  body: RequestResourceData,
  ...rest: any[]
) => Promise<any>;

export type postRelationshipMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  body: RequestRelationshipsData,
  ...rest: any[]
) => Promise<void>;

export type deleteOneMethod = (
  this: JsonApiController,
  id: number,
  ...rest: any[]
) => Promise<void>;

export type deleteRelationshipMethod = (
  this: JsonApiController,
  id: number,
  relName: string,
  body: RequestRelationshipsData,
  ...rest: any[]
) => Promise<void>;

export interface JsonApiController {
  serviceMixin?: JsonApiService;
  getOne?: getOneMethod;
  getAll?: getAllMethod;
  getDirectOne?: getDirectOneMethod;
  getDirectAll?: getDirectAllMethod;
  getRelationship?: getRelationshipMethod;
  patchOne?: patchOneMethod;
  patchRelationship?: patchRelationshipMethod;
  postOne?: postOneMethod;
  postRelationship?: postRelationshipMethod;
  deleteOne?: deleteOneMethod;
  deleteRelationship?: deleteRelationshipMethod;
}
