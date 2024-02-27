export type TypeOfArray<T> = T extends (infer U)[] ? U : T;

export type ValueOf<T> = T[keyof T];
