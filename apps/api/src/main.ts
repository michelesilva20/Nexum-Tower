import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.API_CORS_ORIGIN ?? "http://localhost:3000";
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3333;
  await app.listen(port);
  console.log(`Nexum Tower API running on http://localhost:${port}`);
}

bootstrap();
