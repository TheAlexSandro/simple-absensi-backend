import { config } from 'dotenv';
config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { SpaFallbackFilter } from "./resources/security/exception.filter";
import { AuthGuard } from './resources/security/auth.guard';
import { Tokenify } from "./resources/helper/Tokenify";
import { Reflector } from "@nestjs/core";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());

  const tokenify = app.get(Tokenify);
  const reflector = app.get(Reflector)
  app.use(cookieParser());
  app.useGlobalFilters(new SpaFallbackFilter());
  app.useGlobalGuards(new AuthGuard(tokenify, reflector));
  app.enableCors({
    origin: process.env["FRONTEND_URL"]?.split(","),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  });

  await app.listen(8000, () => {
    console.log('OK');
  });
}
bootstrap();
