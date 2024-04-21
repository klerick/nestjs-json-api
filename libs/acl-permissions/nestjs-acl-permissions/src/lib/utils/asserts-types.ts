import { Method } from '../types';

export function checkInputHttpMethod(
  httpMethod: string
): asserts httpMethod is Method {
  if (!Object.values(Method).includes(httpMethod as Method)) {
    throw new Error(`Invalid HTTP method: ${httpMethod}`);
  }
}
