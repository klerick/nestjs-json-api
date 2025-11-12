import { Logger as NestJsLogger } from '@nestjs/common';

import type { LoggerOptions } from '@mikro-orm/core';
import type { Highlighter } from '@mikro-orm/core';
import type { LogContext, LoggerNamespace } from '@mikro-orm/postgresql';
import { DefaultLogger } from '@mikro-orm/postgresql';

export type AnyString = string & {};

export class DatabaseLoggerService extends DefaultLogger {
  private static logger = new NestJsLogger('MikroOrmDatabaseModule');
  private useHighlighter: Highlighter | undefined = undefined;
  private hasReplicas: boolean | undefined = undefined;

  constructor(options: LoggerOptions) {
    super(options);
    this.useHighlighter = options.highlighter;
    this.hasReplicas = options.usesReplicas;
  }

  override log(
    namespace: LoggerNamespace | AnyString,
    message: string,
    context?: LogContext,
  ): void {
    if (namespace === 'info' && !this.useHighlighter) {
      message = message.replace(
        // eslint-disable-next-line no-control-regex
        /\x1b\[[0-9;]*m/g,
        '',
      );
    }

    message = message.replace(/\n/g, '').replace(/ +/g, ' ').trim();

    if (context && 'contextName' in context) {
      namespace = `${namespace}:${context['contextName']}`;
    }
    const messageResult = `(${namespace}) ${message}`;
    let typeLog: 'debug' | 'error' | 'warn' = 'debug';
    switch (context?.level) {
      case 'error':
        typeLog = 'debug';
        break;
      case 'warning':
        typeLog = 'warn';
        break;
    }

    DatabaseLoggerService.logger[typeLog](messageResult);
  }

  override logQuery(context: { query: string } & LogContext): void {
    if (this.useHighlighter) {
      return super.logQuery(context);
    }

    let msg = context.query;

    if (context.took != null) {
      const meta = [`took ${context.took} ms`];

      if (context.results != null) {
        meta.push(
          `${context.results} result${
            context.results === 0 || context.results > 1 ? 's' : ''
          }`,
        );
      }

      if (context.affected != null) {
        meta.push(
          `${context.affected} row${
            context.affected === 0 || context.affected > 1 ? 's' : ''
          } affected`,
        );
      }

      msg += ` [${meta.join(', ')}]`;
    }

    if (this.hasReplicas && context.connection) {
      msg += ` (via ${context.connection.type} connection '${context.connection.name}')`;
    }

    return this.log('query', msg, context);
  }

  // setDebugMode(debugMode: boolean | LoggerNamespace[]): void {
  //   console.log('setDebugMode', debugMode);
  //   // throw new Error('Method not implemented.');
  // }
  // isEnabled(namespace: LoggerNamespace, context?: LogContext): boolean {
  //   console.log('isEnabled', namespace, context);
  //   // throw new Error('Method not implemented.');
  //   return true;
  // }
}
