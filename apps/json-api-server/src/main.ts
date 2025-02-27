/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setOpenAPIVersion('3.1.0')
    .setTitle('JSON API swagger example')
    .setDescription('The JSON API list example')
    .setVersion('1.0')
    .build();
  app.set('query parser', 'extended');

  SwaggerModule.setup(
    'swagger',
    app,
    () => SwaggerModule.createDocument(app, config),
    {}
  );
  await app.init();
  const port = process.env.PORT || 3000;

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
