import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/infrastructure/config/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lets DatabaseConnection close the pool on SIGTERM.
  app.enableShutdownHooks();

  // Exception filters are registered globally via APP_FILTER in AppModule, not here — registering in
  // both places is what makes `app.get(SomeFilter)` fail, since APP_FILTER providers have no class token.
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
