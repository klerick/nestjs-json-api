import { NestFactory } from '@nestjs/core';
import { ExampleModule } from './example.module';

async function bootstrap() {
  const app = await NestFactory.create(ExampleModule, { cors: true });
  await app.listen(3000);
}
bootstrap();
