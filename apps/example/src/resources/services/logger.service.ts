import { Injectable, Logger as NestLogger } from '@nestjs/common';

@Injectable()
export class Logger extends NestLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
