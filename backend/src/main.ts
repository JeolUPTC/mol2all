import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import * as compression from 'compression'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { ResponseInterceptor } from './shared/interceptors/response.interceptor'

function getAllowedOrigins(): string[] {
  const raw = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  return raw.split(',').map((o) => o.trim()).filter(Boolean)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const isProd = process.env.NODE_ENV === 'production'

  // ── Security headers ──────────────────────────────────────────
  app.use(helmet({
    // Allow inline scripts needed by Swagger UI in dev
    contentSecurityPolicy: isProd,
  }))

  // ── Compression ───────────────────────────────────────────────
  app.use(compression())

  // ── Cookies ───────────────────────────────────────────────────
  app.use(cookieParser())

  // ── Routing ───────────────────────────────────────────────────
  app.setGlobalPrefix('api')

  // ── CORS ──────────────────────────────────────────────────────
  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // ── Validation ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // ── Global filters & interceptors ────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  // ── Swagger (dev only) ───────────────────────────────────────
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MOL2ALL API')
      .setDescription('API de la plataforma educativa gamificada MOL2ALL')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
    console.log(`Documentación: http://localhost:${process.env.PORT ?? 3000}/api/docs`)
  }

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`MOL2ALL backend corriendo en http://localhost:${port}/api`)
}

bootstrap()
