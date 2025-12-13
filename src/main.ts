import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: '*', // En producción, especifica el dominio de tu frontend: ['https://tu-dominio.com']
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configurar prefijo global para la API
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Alertas API')
    .setDescription('API de incidentes viales basados en Waze')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 80;
  await app.listen(port);
  console.log(`Alertas API corriendo en http://localhost:${port}/api/v1 (Swagger: /api/v1/docs)`);
}
bootstrap();
