import {
  Body,
  Param,
  ParseIntPipe,
  Query,
  RequestMethod,
} from '@nestjs/common';

import { BindingsConfig, MethodName } from '../types';
import { JsonBaseController } from '../mixin';
import {
  bodyInputPatchPipeMixin,
  bodyInputPostMixin,
  parseRelationshipNameMixin,
  queryFiledInIncludeMixin,
  querySchemaMixin,
  queryTransformMixin,
  queryTransformSchemaMixin,
  bodyRelationshipPipeMixin,
  bodyRelationshipPatchPipeMixin,
} from '../mixin/pipes';

import { PARAMS_RELATION_NAME, PARAMS_RESOURCE_ID } from '../constants';

const Bindings: BindingsConfig = {
  getAll: {
    method: RequestMethod.GET,
    name: 'getAll',
    path: '',
    implementation: JsonBaseController.prototype['getAll'],
    parameters: [
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryTransformMixin,
          queryTransformSchemaMixin,
          queryFiledInIncludeMixin,
        ],
      },
    ],
  },
  getOne: {
    method: RequestMethod.GET,
    name: 'getOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype['getOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryTransformMixin,
          queryTransformSchemaMixin,
          queryFiledInIncludeMixin,
        ],
      },
    ],
  },
  deleteOne: {
    method: RequestMethod.DELETE,
    name: 'deleteOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype['deleteOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
    ],
  },
  postOne: {
    method: RequestMethod.POST,
    name: 'postOne',
    path: '',
    implementation: JsonBaseController.prototype['postOne'],
    parameters: [
      {
        decorator: Body,
        mixins: [bodyInputPostMixin],
      },
    ],
  },
  patchOne: {
    method: RequestMethod.PATCH,
    name: 'patchOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype['patchOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        decorator: Body,
        mixins: [bodyInputPatchPipeMixin],
      },
    ],
  },
  getRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'getRelationship',
    method: RequestMethod.GET,
    implementation: JsonBaseController.prototype['getRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNameMixin],
      },
    ],
  },
  deleteRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'deleteRelationship',
    method: RequestMethod.DELETE,
    implementation: JsonBaseController.prototype['deleteRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNameMixin],
      },
      {
        decorator: Body,
        mixins: [bodyRelationshipPipeMixin],
      },
    ],
  },
  postRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'postRelationship',
    method: RequestMethod.POST,
    implementation: JsonBaseController.prototype['postRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNameMixin],
      },
      {
        decorator: Body,
        mixins: [bodyRelationshipPipeMixin],
      },
    ],
  },
  patchRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'patchRelationship',
    method: RequestMethod.PATCH,
    implementation: JsonBaseController.prototype['patchRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [() => ParseIntPipe],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNameMixin],
      },
      {
        decorator: Body,
        mixins: [bodyRelationshipPatchPipeMixin],
      },
    ],
  },
};

export { Bindings };

export function excludeMethod(
  names: Array<Partial<MethodName>>
): Array<MethodName> {
  const tmpObject = names.reduce((acum, key) => ((acum[key] = true), acum), {});
  return Object.keys(Bindings).filter(
    (method) => !tmpObject[method]
  ) as Array<MethodName>;
}
