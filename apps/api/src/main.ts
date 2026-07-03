import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { GlobalResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new GlobalResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const corsOrigin = process.env.WEB_ORIGIN ?? process.env.API_CORS_ORIGIN ?? "http://localhost:3000";
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3333;
  await app.listen(port);
  console.log(`Nexum Tower API running on http://localhost:${port}`);
}

bootstrap();
