import { getAll } from './get-all';
import { getOne } from './get-one';
import { deleteOne } from './delete-one';
import { postOne } from './post-one';
import { patchOne } from './patch-one';
import { getRelationship } from './get-relationship';
import { deleteRelationship } from './delete-relationship';
import { postRelationship } from './post-relationship';
import { patchRelationship } from './patch-relationship';

export const swaggerMethod = {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  deleteRelationship,
  postRelationship,
  patchRelationship,
};

export const errorSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'number',
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          detail: {
            type: 'string',
          },
          source: {
            type: 'object',
            properties: {
              parameter: {
                type: 'string',
              },
            },
          },
        },
        required: ['detail'],
      },
    },
  },
};
