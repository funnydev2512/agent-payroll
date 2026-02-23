import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '127.0.0.1');

  logger.log('\n🚀 Paychef Backend Server Running');
  logger.log(`📡 Port: ${port}`);
  logger.log(`🌐 Network: Base Sepolia`);
  logger.log(`\n📋 API Endpoints:`);
  logger.log(`   POST /payroll/upload - Upload CSV`);
  logger.log(`   POST /payroll/run - Execute payroll`);
  logger.log(`   GET  /payroll/current - Get current payroll`);
  logger.log(`   POST /session/create - Create session key`);
  logger.log(`   GET  /session/status - Session key status`);
  logger.log(`   GET  /session/balance - Agent wallet balance`);
  logger.log(`   POST /session/revoke - Revoke session key`);
  logger.log(`   GET  /history - Payroll history`);
  logger.log(`   GET  /health - Health check\n`);
}

bootstrap();
