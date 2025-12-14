import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { TicketStatus, TicketSource } from '@prisma/client';

export class CreateTicketDto {
  @ApiPropertyOptional({ description: 'UUID del incidente de Waze (obligatorio si source es WAZE)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  incidentUuid?: string;

  @ApiPropertyOptional({ description: 'ID del incidente (deprecated, usar incidentUuid)', example: 857487, deprecated: true })
  @IsOptional()
  @IsInt()
  incidentId?: number;

  @ApiProperty({ 
    enum: TicketSource, 
    description: 'Fuente del ticket',
    example: 'WAZE',
    default: 'OTHER'
  })
  @IsEnum(TicketSource)
  source!: TicketSource;

  @ApiPropertyOptional({ description: 'Tipo de incidente', example: 'ACCIDENT' })
  @IsOptional()
  @IsString()
  incidentType?: string;

  @ApiProperty({ description: 'Título del ticket', example: 'Revisar incidente en Av. Principal' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada', example: 'Este incidente requiere verificación en campo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prioridad (1-5)', example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'ID del usuario asignado', example: 2 })
  @IsOptional()
  @IsInt()
  assignedToUserId?: number;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Título del ticket' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prioridad (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'ID del usuario asignado' })
  @IsOptional()
  @IsInt()
  assignedToUserId?: number;
}

export class ChangeTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, description: 'Nuevo estado del ticket' })
  @IsNotEmpty()
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @ApiPropertyOptional({ description: 'Comentario sobre el cambio de estado' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class AddCommentDto {
  @ApiProperty({ description: 'Comentario sobre el ticket', example: 'Se contactó con el operador de campo' })
  @IsNotEmpty()
  @IsString()
  message!: string;
}

export class TicketEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ticketId!: string;

  @ApiProperty()
  eventType!: string;

  @ApiPropertyOptional()
  fromStatus?: string;

  @ApiPropertyOptional()
  toStatus?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  payload?: any;

  @ApiProperty()
  createdByUserId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  createdBy!: {
    id: number;
    fullName: string;
    username: string;
  };
}

export class IncidentSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  uuid!: string;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  street?: string;

  @ApiProperty()
  status!: string;
}

export class TicketDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ description: 'UUID del incidente de Waze' })
  incidentUuid?: string;

  @ApiPropertyOptional({ description: 'ID del incidente (deprecated)' })
  incidentId?: string;

  @ApiProperty({ enum: TicketSource })
  source!: TicketSource;

  @ApiPropertyOptional()
  incidentType?: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TicketStatus })
  status!: TicketStatus;

  @ApiPropertyOptional()
  priority?: number;

  @ApiProperty()
  createdByUserId!: number;

  @ApiPropertyOptional()
  assignedToUserId?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: IncidentSummaryDto })
  incident?: IncidentSummaryDto;

  @ApiProperty()
  createdBy!: {
    id: number;
    fullName: string;
    username: string;
  };

  @ApiPropertyOptional()
  assignedTo?: {
    id: number;
    fullName: string;
    username: string;
  };

  @ApiPropertyOptional({ type: [TicketEventDto] })
  recentEvents?: TicketEventDto[];
}
