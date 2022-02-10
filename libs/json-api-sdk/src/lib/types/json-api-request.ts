import { ResourceData } from './json-api-response';

export type ResourceRequestObject<T>  = {
  data: ResourceData<T>,
}
