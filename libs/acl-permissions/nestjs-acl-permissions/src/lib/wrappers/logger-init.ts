import { Logger } from '@nestjs/common';

if (process.env['USE_ATTACH_BUFFER']){
  Logger.attachBuffer()
}

export const loggerWrapper = new Logger('ACL init');
