import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ImATeapotException } from '@nestjs/common/exceptions/im-a-teapot.exception';
import { Request, Response } from 'express';
import { PreconditionFailedException } from '@nestjs/common/exceptions/precondition-failed.exception';

@Catch(ImATeapotException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: false,
    });
  }
}

@Catch(PreconditionFailedException)
export class HttpExceptionMethodFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: true,
    });
  }
}
