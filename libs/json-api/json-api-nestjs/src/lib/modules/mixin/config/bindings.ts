import { Body, Param, Query, RequestMethod } from '@nestjs/common';

import { BindingsConfig } from '../types';
import { JsonBaseController } from '../controllers/json-base.controller';
import {
  METHOD_NAME,
  PARAMS_RELATION_NAME,
  PARAMS_RESOURCE_ID,
} from '../../../constants';

import {
  queryInputMixin,
  queryMixin,
  queryFiledInIncludeMixin,
  queryCheckSelectFieldMixin,
  idPipeMixin,
  checkItemEntityPipeMixin,
  postInputPipeMixin,
  patchInputPipeMixin,
  parseRelationshipNamePipeMixin,
  postRelationshipPipeMixin,
  patchRelationshipPipeMixin,
  metaExtractorPipeMixin,
} from '../pipe';

const Bindings: BindingsConfig = {
  [METHOD_NAME.getAll]: {
    method: RequestMethod.GET,
    name: 'getAll',
    path: '/',
    implementation: JsonBaseController.prototype.getAll,
    parameters: [
      {
        decorator: Query,
        mixins: [
          queryInputMixin,
          queryMixin,
          queryFiledInIncludeMixin,
          queryCheckSelectFieldMixin,
        ],
      },
    ],
  },
  [METHOD_NAME.getOne]: {
    method: RequestMethod.GET,
    name: 'getOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype.getOne,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        decorator: Query,
        mixins: [
          queryInputMixin,
          queryMixin,
          queryFiledInIncludeMixin,
          queryCheckSelectFieldMixin,
        ],
      },
    ],
  },
  [METHOD_NAME.deleteOne]: {
    method: RequestMethod.DELETE,
    name: 'deleteOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype.deleteOne,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
    ],
  },
  [METHOD_NAME.postOne]: {
    method: RequestMethod.POST,
    name: 'postOne',
    path: '/',
    implementation: JsonBaseController.prototype.postOne,
    parameters: [
      {
        decorator: Body,
        mixins: [postInputPipeMixin],
      },
      {
        decorator: Body,
        mixins: [metaExtractorPipeMixin],
      },
    ],
  },
  [METHOD_NAME.patchOne]: {
    method: RequestMethod.PATCH,
    name: 'patchOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype.patchOne,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        decorator: Body,
        mixins: [patchInputPipeMixin],
      },
      {
        decorator: Body,
        mixins: [metaExtractorPipeMixin],
      },
    ],
  },
  [METHOD_NAME.getRelationship]: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'getRelationship',
    method: RequestMethod.GET,
    implementation: JsonBaseController.prototype.getRelationship,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNamePipeMixin],
      },
    ],
  },
  [METHOD_NAME.postRelationship]: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'postRelationship',
    method: RequestMethod.POST,
    implementation: JsonBaseController.prototype['postRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNamePipeMixin],
      },
      {
        decorator: Body,
        mixins: [postRelationshipPipeMixin],
      },
      {
        decorator: Body,
        mixins: [metaExtractorPipeMixin],
      },
    ],
  },
  [METHOD_NAME.deleteRelationship]: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'deleteRelationship',
    method: RequestMethod.DELETE,
    implementation: JsonBaseController.prototype['deleteRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNamePipeMixin],
      },
      {
        decorator: Body,
        mixins: [postRelationshipPipeMixin],
      },
      {
        decorator: Body,
        mixins: [metaExtractorPipeMixin],
      },
    ],
  },
  [METHOD_NAME.patchRelationship]: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'patchRelationship',
    method: RequestMethod.PATCH,
    implementation: JsonBaseController.prototype['patchRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [idPipeMixin, checkItemEntityPipeMixin],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [parseRelationshipNamePipeMixin],
      },
      {
        decorator: Body,
        mixins: [patchRelationshipPipeMixin],
      },
      {
        decorator: Body,
        mixins: [metaExtractorPipeMixin],
      },
    ],
  },
};

export { Bindings };
