/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const ligerInst = app.get(Logger);
  app.useLogger(ligerInst);
  app.flushLogs();
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('JSON API swagger example')
    .setDescription('The JSON API list example')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {});

  const port = process.env.PORT || 3333;
  await app.listen(port);
  ligerInst.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
