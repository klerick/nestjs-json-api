export type InputType = {
  a: number;
  b: number;
};

export type OutputType = {
  c: string;
  d: string;
};

export interface RpcService {
  someMethode(firstArg: number): Promise<number>;
  someOtherMethode(firstArg: number, secondArgument: number): Promise<string>;
  methodeWithObjectParams(a: InputType): Promise<OutputType>;
}
