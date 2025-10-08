import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://nexbazaar.shop',
      'https://www.nexbazaar.shop',
      'http://localhost:3000', // keep this for local dev
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap().catch((err) => {
  console.error('Error during app bootstrap:', err);
});
