import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [PrismaModule, IncidentsModule],
})
export class AppModule {}
