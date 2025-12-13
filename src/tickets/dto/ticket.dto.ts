import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ description: 'ID del incidente relacionado', example: 123 })
  @IsNotEmpty()
  @IsInt()
  incidentId!: number;

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

  @ApiProperty()
  incidentId!: string;

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
