import { ExecutionContext, HttpException } from '@nestjs/common';


export function prepareHttpError(
  context: ExecutionContext,
  error: HttpException,
): HttpException {
  const response = error.getResponse() as any;
  const status = error.getStatus();
  const errors = [];

  switch (typeof response.message) {
    case 'string':
      errors.push({ detail: response.message });
      break;

    case 'object':
      if (Array.isArray(response.message)) {
        errors.push(...response.message);
      } else {
        errors.push(response.message);
      }
      break;

    default:
      errors.push(response);
  }

  const preparedError = new HttpException({ errors }, status);
  preparedError.stack = error.stack;
  return preparedError;
}
