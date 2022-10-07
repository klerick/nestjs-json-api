import { Attributes, Relationships } from './response';

export type ResourceRequestObject<T> = {
  data: {
    type: string;
    id?: string;
    attributes: Attributes<Omit<T, 'id'>>;
    relationships?: Partial<Relationships<T>>;
  };
};
