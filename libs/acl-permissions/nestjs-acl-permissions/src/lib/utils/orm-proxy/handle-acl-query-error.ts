import {
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

/**
 * Handles errors that occur during ACL query execution
 *
 * In development mode:
 * - Logs detailed error information
 * - Throws InternalServerErrorException with error details
 *
 * In production mode:
 * - Logs error without details
 * - Throws ForbiddenException without revealing ACL logic
 *
 * @param error - The error that occurred
 * @param subject - The subject (entity name) being queried
 * @param methodName - The proxy method name (for logging context)
 * @return {InternalServerErrorException} In development mode
 * @return {ForbiddenException} In production mode
 */
export function handleAclQueryError(
  error: unknown,
  subject: string,
  methodName: string
): HttpException {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  // Log error for debugging
  Logger.error(
    `ACL query execution failed for subject "${subject}": ${
      error instanceof Error ? error.message : String(error)
    }`,
    error instanceof Error ? error.stack : undefined,
    methodName
  );

  if (error instanceof HttpException) {
    throw error
  }

  if (isDevelopment) {
    // Development: 500 with error details for debugging
    return new InternalServerErrorException(
      [
        {
          code: 'internal_server_error',
          message: `ACL query failed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
          path: [],
        },
      ],
      {
        description: `Failed to execute ACL query for subject "${subject}"`,
      }
    );
  }

  // Production: 403 without details to avoid leaking ACL logic
  return new ForbiddenException(
    [
      {
        code: 'forbidden',
        message: 'not allow access',
        path: [],
      },
    ],
    {
      description: `Access denied for subject "${subject}"`,
    }
  );
}
