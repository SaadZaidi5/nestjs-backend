import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://mathilda-horotelic-euclid.ngrok-free.dev',
      'https://marketplace-frontend-live.vercel.app',
    ], // Your Next.js frontend URL
    credentials: true,
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);
}
bootstrap();
