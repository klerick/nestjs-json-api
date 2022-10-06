import {Body, Param, ParseIntPipe, Query, RequestMethod} from '@nestjs/common';

import {BindingsConfig, MethodName} from '../types';
import {
  bodyInputPatchPipeMixin,
  bodyInputPostMixin,
  parseRelationshipNameMixin,
  queryFiledInIncludeMixin,
  querySchemaMixin,
  queryTransformMixin,
  queryTransformSchemaMixin,
  bodyRelationshipPipeMixin,
  bodyRelationshipPatchPipeMixin
} from '../mixin/pipes';

import {PARAMS_RELATION_NAME, PARAMS_RESOURCE_ID} from '../constants';

const Bindings: any = {
  getAll: {
    method: RequestMethod.GET,
    name: 'getAll',
    path: '',
    implementation: async function (query, rest) {
      return this.serviceMixin.getAll({query});
    },
    parameters: [{
      decorator: Query,
      mixins: [
        querySchemaMixin,
        queryTransformMixin,
        queryTransformSchemaMixin,
        queryFiledInIncludeMixin
      ]
    }]
  },
  getOne: {
    method: RequestMethod.GET,
    name: 'getOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: async function (id, query, rest) {
      return this.serviceMixin.getOne({
        route: {
          id
        },
        query
      });
    },
    parameters: [{
      property: PARAMS_RESOURCE_ID,
      decorator: Param,
      mixins: [
        () => ParseIntPipe,
      ]
    }, {
      decorator: Query,
      mixins: [
        querySchemaMixin,
        queryTransformMixin,
        queryTransformSchemaMixin,
        queryFiledInIncludeMixin
      ]
    }]
  },
  deleteOne: {
    method: RequestMethod.DELETE,
    name: 'deleteOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: async function (id, rest) {
      return this.serviceMixin.deleteOne({
        route: {
          id
        }
      });
    },
    parameters: [{
      property: PARAMS_RESOURCE_ID,
      decorator: Param,
      mixins: [
        () => ParseIntPipe,
      ]
    }]
  },
  postOne: {
    method: RequestMethod.POST,
    name: 'postOne',
    path: '',
    implementation: async function (body, ...rest) {
      return this.serviceMixin.postOne({
        body
      });
    },
    parameters: [{
      decorator: Body,
      mixins: [
        bodyInputPostMixin
      ]
    }]
  },
  patchOne: {
    method: RequestMethod.PATCH,
    name: 'patchOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: async function (id, body, ...rest) {
      return this.serviceMixin.patchOne({
        body,
        ...{
          route: {
            id
          }
        }
      });
    },
    parameters: [{
      property: PARAMS_RESOURCE_ID,
      decorator: Param,
      mixins: [
        () => ParseIntPipe,
      ]
    }, {
      decorator: Body,
      mixins: [
        bodyInputPatchPipeMixin
      ]
    }]
  },
  getRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'getRelationship',
    method: RequestMethod.GET,
    implementation: function (id, relName){
      return this.serviceMixin.getRelationship({
        route: { id, relName }
      })
    },
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          () => ParseIntPipe,
        ]
      },{
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ]
      }
    ]
  },
  deleteRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'deleteRelationship',
    method: RequestMethod.DELETE,
    implementation: function (id, relName, body){
      return this.serviceMixin.deleteRelationship({
        route: { id, relName },
        body
      })
    },
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          () => ParseIntPipe,
        ]
      },{
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ]
      },{
        decorator: Body,
        mixins: [
          bodyRelationshipPipeMixin
        ]
      }
    ]
  },
  postRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'postRelationship',
    method: RequestMethod.POST,
    implementation: function (id, relName, body){
      return this.serviceMixin.postRelationship({
        route: { id, relName },
        body
      })
    },
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          () => ParseIntPipe,
        ]
      },{
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ]
      },{
        decorator: Body,
        mixins: [
          bodyRelationshipPipeMixin
        ]
      }
    ]
  },
  patchRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: 'patchRelationship',
    method: RequestMethod.PATCH,
    implementation: function (id, relName, body){
      return this.serviceMixin.patchRelationship({
        route: { id, relName },
        body
      })
    },
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          () => ParseIntPipe,
        ]
      },{
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ]
      },{
        decorator: Body,
        mixins: [
          bodyRelationshipPatchPipeMixin
        ]
      }
    ]
  }
};

export {
  Bindings
};

export function excludeMethod(names: Array<Partial<MethodName>>): Array<MethodName> {
  const tmpObject = names.reduce((acum, key) => (acum[key] = true, acum), {})
  return Object.keys(Bindings).filter(method => !tmpObject[method]) as Array<MethodName>
}
