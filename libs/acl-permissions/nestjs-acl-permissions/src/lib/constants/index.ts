import {
  Actions,
  Method,
  MethodActionMap as MethodActionMapType,
} from '../types';

export const IS_PUBLIC_META_KEY = Symbol('IS_PUBLIC_META_KEY');
export const GET_PERMISSION_RULES = Symbol('GET_PERMISSION_RULES');

export const MethodActionMap: MethodActionMapType = {
  [Method.DELETE]: Actions.delete,
  [Method.GET]: Actions.read,
  [Method.PATCH]: Actions.update,
  [Method.POST]: Actions.create,
};
