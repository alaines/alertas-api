import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  ChangeTicketStatusDto,
  AddCommentDto,
  TicketDto,
  TicketEventDto,
} from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketStatus } from '@prisma/client';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ 
    summary: 'Crear un nuevo ticket',
    description: 'Solo usuarios con rol ADMIN u OPERATOR pueden crear tickets. Se crea automáticamente un evento CREATED en el historial.'
  })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente', type: TicketDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para crear tickets' })
  @ApiResponse({ status: 404, description: 'Incidente no encontrado' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketDto> {
    return this.ticketsService.create(createTicketDto, user.sub);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar todos los tickets',
    description: 'Obtiene una lista de tickets con filtros opcionales'
  })
  @ApiQuery({ name: 'status', enum: TicketStatus, required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'incidentId', type: Number, required: false, description: 'Filtrar por ID de incidente' })
  @ApiQuery({ name: 'assignedToUserId', type: Number, required: false, description: 'Filtrar por usuario asignado' })
  @ApiQuery({ name: 'createdByUserId', type: Number, required: false, description: 'Filtrar por usuario creador' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Límite de resultados (máx 100)' })
  @ApiResponse({ status: 200, description: 'Lista de tickets', type: [TicketDto] })
  async findAll(
    @Query('status') status?: TicketStatus,
    @Query('incidentId') incidentId?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('createdByUserId') createdByUserId?: string,
    @Query('limit') limit?: string,
  ): Promise<TicketDto[]> {
    return this.ticketsService.findAll({
      status,
      incidentId: incidentId ? Number(incidentId) : undefined,
      assignedToUserId: assignedToUserId ? Number(assignedToUserId) : undefined,
      createdByUserId: createdByUserId ? Number(createdByUserId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener un ticket por ID',
    description: 'Devuelve los detalles del ticket incluyendo información del incidente y los 10 eventos más recientes'
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Detalles del ticket', type: TicketDto })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TicketDto> {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ 
    summary: 'Actualizar un ticket',
    description: 'Solo usuarios con rol ADMIN u OPERATOR pueden actualizar tickets. Crea un evento UPDATED con los campos modificados.'
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket actualizado', type: TicketDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar tickets' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: any,
  ): Promise<TicketDto> {
    return this.ticketsService.update(id, updateTicketDto, user.sub);
  }

  @Post(':id/status')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ 
    summary: 'Cambiar el estado de un ticket',
    description: 'Solo usuarios con rol ADMIN u OPERATOR. Crea un evento STATUS_CHANGED en el historial.'
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({ status: 200, description: 'Estado cambiado exitosamente', type: TicketDto })
  @ApiResponse({ status: 400, description: 'Estado inválido o igual al actual' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeTicketStatusDto,
    @CurrentUser() user: any,
  ): Promise<TicketDto> {
    return this.ticketsService.changeStatus(id, changeStatusDto, user.sub);
  }

  @Post(':id/comments')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ 
    summary: 'Agregar un comentario al ticket',
    description: 'Solo usuarios con rol ADMIN u OPERATOR. Crea un evento COMMENT en el historial.'
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({ status: 201, description: 'Comentario agregado', type: TicketEventDto })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser() user: any,
  ): Promise<TicketEventDto> {
    return this.ticketsService.addComment(id, addCommentDto, user.sub);
  }

  @Get(':id/events')
  @ApiOperation({ 
    summary: 'Obtener el historial de eventos de un ticket',
    description: 'Devuelve todos los eventos (cambios, comentarios, asignaciones) del ticket en orden cronológico inverso'
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Límite de eventos (default: 50)' })
  @ApiResponse({ status: 200, description: 'Historial de eventos', type: [TicketEventDto] })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async getEvents(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ): Promise<TicketEventDto[]> {
    return this.ticketsService.getEvents(id, limit ? Number(limit) : undefined);
  }
}
