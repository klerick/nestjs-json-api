import { ObjectLiteral } from 'typeorm';

import { ResponseResourceData } from '../types';


export interface JsonApiTransform {
  transformInclude(data: ObjectLiteral): ResponseResourceData[];
  transformData(data: ObjectLiteral): ResponseResourceData;
  getRelationshipLink(
    resourceName: string,
    resourceId: string,
    relationName: string,
  ): string;
  getResourceLink(
    resourceName: string,
    resourceId: string,
  ): string;
  getDirectLink(
    resourceName: string,
    resourceId: string,
    relationName: string,
  ): string;
}
