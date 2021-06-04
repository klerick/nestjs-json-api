import { Body, Param, Query, RequestMethod } from '@nestjs/common';

import { BindingsConfig, JsonApiController, MethodName } from '../types';
import {
  bodyDeleteRelationshipMixin,
  parseRelationshipNameMixin,
  bodyPatchRelationshipMixin,
  bodyPostRelationshipMixin,
  parseResourceIdMixin,
  querySchemaMixin,
  queryParamsMixin,
  bodyPatchMixin,
  bodyPostMixin,
} from '../mixins';
import {
  PARAMS_RELATION_NAME,
  PARAMS_RELATION_ID,
  PARAMS_RESOURCE_ID,
} from '../constants/reflection';


export const Bindings: BindingsConfig = {
  deleteOne: {
    method: RequestMethod.DELETE,
    path: `:${PARAMS_RESOURCE_ID}`,
    name: 'deleteOne',
    implementation: function (id) {
      return this.serviceMixin.deleteOne({ route: { id } });
    } as JsonApiController['deleteOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin,
        ]
      }
    ],
  },
  deleteRelationship: {
    method: RequestMethod.DELETE,
    name: 'deleteRelationship',
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    implementation: async function (id, relName, body) {
      return this.serviceMixin.deleteRelationship({
        route: { id, relName },
        body,
      });
    } as JsonApiController['deleteRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
      {
        property: 'data',
        decorator: Body,
        mixins: [
          bodyDeleteRelationshipMixin,
        ],
      }
    ],
  },
  getAll: {
    method: RequestMethod.GET,
    name: 'getAll',
    path: '',
    implementation: async function (query) {
      return this.serviceMixin.getAll({ query });
    } as JsonApiController['getAll'],
    parameters: [
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryParamsMixin,
        ]
      }
    ]
  },
  getOne: {
    method: RequestMethod.GET,
    name: 'getOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: async function (id, query) {
      return this.serviceMixin.getOne({
        route: { id },
        query,
      });
    } as JsonApiController['getOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin,
        ]
      },
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryParamsMixin,
        ]
      }
    ]
  },
  getRelationship: {
    method: RequestMethod.GET,
    name: 'getRelationship',
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    implementation: async function (id, relName) {
      return this.serviceMixin.getRelationship({
        route: { id, relName },
      });
    } as JsonApiController['getRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
    ]
  },
  getDirectOne: {
    method: RequestMethod.GET,
    name: 'getDirectOne',
    path: `:${PARAMS_RESOURCE_ID}/:${PARAMS_RELATION_NAME}/:${PARAMS_RELATION_ID}`,
    implementation: async function (id, relName, relId, query) {
      return this.serviceMixin.getDirectOne({
        route: { id, relName, relId },
        query,
      });
    } as JsonApiController['getDirectOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
      {
        property: PARAMS_RELATION_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryParamsMixin,
        ]
      }
    ]
  },
  getDirectAll: {
    method: RequestMethod.GET,
    name: 'getDirectAll',
    path: `:${PARAMS_RESOURCE_ID}/:${PARAMS_RELATION_NAME}`,
    implementation: async function (id, relName, query) {
      return this.serviceMixin.getDirectAll({
        route: { id, relName },
        query,
      });
    } as JsonApiController['getDirectAll'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
      {
        decorator: Query,
        mixins: [
          querySchemaMixin,
          queryParamsMixin,
        ]
      }
    ]
  },
  patchOne: {
    method: RequestMethod.PATCH,
    name: 'patchOne',
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: async function (id, body) {
      return this.serviceMixin.patchOne({
        route: { id },
        body,
      });
    } as JsonApiController['patchOne'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: 'data',
        decorator: Body,
        mixins: [
          bodyPatchMixin
        ],
      },
    ]
  },
  patchRelationship: {
    method: RequestMethod.PATCH,
    name: 'patchRelationship',
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    implementation: async function (id, relName, body) {
      return this.serviceMixin.patchRelationship({
        route: { id, relName },
        body,
      });
    } as JsonApiController['patchRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
      {
        property: 'data',
        decorator: Body,
        mixins: [
          bodyPatchRelationshipMixin
        ],
      },
    ]
  },
  postOne: {
    method: RequestMethod.POST,
    name: 'postOne',
    path: '',
    implementation: async function (body) {
      return this.serviceMixin.postOne({
        body,
      });
    } as JsonApiController['postOne'],
    parameters: [
      {
        property: 'data',
        decorator: Body,
        mixins: [
          bodyPostMixin
        ],
      },
    ]
  },
  postRelationship: {
    method: RequestMethod.POST,
    name: 'postRelationship',
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    implementation: async function (id, relName, body) {
      return this.serviceMixin.postRelationship({
        route: { id, relName },
        body,
      });
    } as JsonApiController['postRelationship'],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [
          parseResourceIdMixin
        ],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [
          parseRelationshipNameMixin
        ],
      },
      {
        property: 'data',
        decorator: Body,
        mixins: [
          bodyPostRelationshipMixin
        ],
      },
    ]
  }
};

export function excludeMethod(names: Array<Partial<MethodName>>): Array<MethodName> {
  const tmpObject = names.reduce((acum, key) => (acum[key] = true, acum), {})
  return Object.keys(Bindings).filter(method => !tmpObject[method]) as Array<MethodName>
}
