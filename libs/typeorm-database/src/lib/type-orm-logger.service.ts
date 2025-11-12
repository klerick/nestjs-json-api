import { AbstractLogger, LogMessage, QueryRunner, LogLevel } from 'typeorm';
import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { config } from './config';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';

@Injectable()
export class TypeOrmLoggerService extends AbstractLogger {
  private logger: NestLogger = new NestLogger(TypeOrmLoggerService.name);
  protected override options: LoggerOptions | undefined = config.logging ? 'all' : undefined;

  protected writeLog(
    level: LogLevel,
    logMessage: LogMessage | string | number | (LogMessage | string | number)[],
  ): void {

    const messages = this.prepareLogMessages(logMessage, {
      highlightSql: true,
    });
    for (const message of messages) {
      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
          this.logger.log(message.message);
          break;
        case 'info':
        case 'query':
          this.logger.debug(this.getStringMsg(message.message, message.prefix));
          break;
        case 'warn':
        case 'query-slow':
          this.logger.warn(this.getStringMsg(message.message, message.prefix));
          break;
        case 'error':
        case 'query-error':
          this.logger.error(this.getStringMsg(message.message, message.prefix));
          break;
      }
    }
  }

  private getStringMsg(msg: string | number, prefix?: string): string {
    return prefix ? `${prefix} ${msg}` : `${msg}`;
  }
}
