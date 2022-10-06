import {getAll} from './get-all/get-all';
import {getOne} from './get-one/get-one';
import {deleteOne} from './delete-one/delete-one';
import {postOne} from './post-one/post-one';
import {patchOne} from './patch-one/patch-one';
import {getRelationship} from './get-relationship/get-relationship';
import {deleteRelationship} from './delete-relationship/delete-relationship';
import {postRelationship} from './post-relationship/post-relationship';
import {patchRelationship} from './patch-relationship/patch-relationship';

export const MethodsService = {
  getAll,
  getOne,
  deleteOne,
  postOne,
  patchOne,
  getRelationship,
  deleteRelationship,
  postRelationship,
  patchRelationship
}
