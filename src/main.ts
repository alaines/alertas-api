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

  // Swagger solo en desarrollo
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Alertas API')
      .setDescription('API de incidentes viales, tickets y periféricos urbanos')
      .setVersion('1.1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT',
        },
        'bearer',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log(`Swagger UI disponible en: http://localhost:${process.env.PORT || 80}/api`);
  }

  const port = process.env.PORT || 80;
  await app.listen(port);
  
  const env = isProduction ? 'PRODUCCIÓN' : 'DESARROLLO';
  console.log(`\nAlertas API v1.1.0 corriendo en modo ${env}`);
  console.log(`URL: http://localhost:${port}/api/v1`);
}
bootstrap();
