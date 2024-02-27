export type KebabCase<S> = S extends `${infer C}${infer T}`
  ? KebabCase<T> extends infer U
    ? U extends string
      ? T extends Uncapitalize<T>
        ? `${Uncapitalize<C>}${U}`
        : `${Uncapitalize<C>}-${U}`
      : never
    : never
  : S;

export type KebabToCamelCase<S extends string> =
  S extends `${infer T}-${infer U}-${infer V}`
    ? `${T}${Capitalize<U>}${Capitalize<KebabToCamelCase<V>>}`
    : S extends `${infer T}-${infer U}`
    ? `${Capitalize<T>}${Capitalize<KebabToCamelCase<U>>}`
    : S;
