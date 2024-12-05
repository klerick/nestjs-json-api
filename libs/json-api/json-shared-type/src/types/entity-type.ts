export type EntityField =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null
  | Date;

export type EntityProps<T> = {
  [P in keyof T]: T[P] extends EntityField ? P : never;
}[keyof T];

export type EntityRelation<T> = {
  [P in keyof T]: T[P] extends EntityField ? never : P;
}[keyof T];
