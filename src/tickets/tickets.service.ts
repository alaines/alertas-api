import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, ChangeTicketStatusDto, AddCommentDto, TicketDto, TicketEventDto } from './dto/ticket.dto';
import { TicketStatus, TicketEventType, TicketSource } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // Helper para cargar incidente si existe (preferir UUID sobre ID)
  private async loadIncidentIfExists(incidentUuid: string | null, incidentId: bigint | null = null) {
    if (!incidentUuid && !incidentId) return null;
    
    const incident = await this.prisma.wazeIncident.findUnique({
      where: incidentUuid ? { uuid: incidentUuid } : { id: incidentId! },
    });

    if (!incident) return null;

    return {
      id: incident.id.toString(),
      uuid: incident.uuid,
      type: incident.type,
      category: incident.category ?? undefined,
      city: incident.city ?? undefined,
      street: incident.street ?? undefined,
      status: incident.status,
    };
  }

  async create(createTicketDto: CreateTicketDto, userId: number): Promise<TicketDto> {
    // Validar que si la fuente es WAZE, debe tener incidentUuid o incidentId
    if (createTicketDto.source === TicketSource.WAZE && !createTicketDto.incidentUuid && !createTicketDto.incidentId) {
      throw new BadRequestException('incidentUuid es obligatorio cuando la fuente es WAZE');
    }

    // Si se proporciona incidentId pero no incidentUuid, buscar el UUID
    let incidentUuid = createTicketDto.incidentUuid;
    let incidentId = createTicketDto.incidentId ? BigInt(createTicketDto.incidentId) : null;

    if (createTicketDto.source === TicketSource.WAZE) {
      if (createTicketDto.incidentId && !incidentUuid) {
        // Buscar UUID por ID (para compatibilidad con código antiguo)
        const incident = await this.prisma.wazeIncident.findUnique({
          where: { id: BigInt(createTicketDto.incidentId) },
          select: { uuid: true, id: true },
        });
        if (incident) {
          incidentUuid = incident.uuid;
          incidentId = incident.id;
        }
      } else if (incidentUuid && !createTicketDto.incidentId) {
        // Buscar ID por UUID (preferido)
        const incident = await this.prisma.wazeIncident.findUnique({
          where: { uuid: incidentUuid },
          select: { uuid: true, id: true },
        });
        if (incident) {
          incidentId = incident.id;
        }
      }
    }

    // Verificar usuario asignado si se proporciona
    if (createTicketDto.assignedToUserId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: createTicketDto.assignedToUserId },
      });

      if (!assignedUser) {
        throw new BadRequestException(`Usuario asignado con ID ${createTicketDto.assignedToUserId} no encontrado`);
      }
    }

    // Crear ticket y evento en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          incidentId: incidentId,
          incidentUuid: incidentUuid,
          source: createTicketDto.source,
          incidentType: createTicketDto.incidentType,
          title: createTicketDto.title,
          description: createTicketDto.description,
          priority: createTicketDto.priority,
          createdByUserId: userId,
          assignedToUserId: createTicketDto.assignedToUserId,
          status: TicketStatus.OPEN,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      // Crear evento CREATED
      await tx.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: TicketEventType.CREATED,
          toStatus: TicketStatus.OPEN,
          message: 'Ticket creado',
          payload: createTicketDto as any,
          createdByUserId: userId,
        },
      });

      // Si se asigna usuario, crear evento ASSIGNED
      if (createTicketDto.assignedToUserId) {
        await tx.ticketEvent.create({
          data: {
            ticketId: ticket.id,
            eventType: TicketEventType.ASSIGNED,
            message: `Asignado a usuario ID ${createTicketDto.assignedToUserId}`,
            payload: { assignedToUserId: createTicketDto.assignedToUserId },
            createdByUserId: userId,
          },
        });
      }

      return ticket;
    });

    return this.mapTicketToDto(result);
  }

  async findAll(filters: {
    status?: TicketStatus;
    source?: TicketSource;
    incidentId?: number;
    assignedToUserId?: number;
    createdByUserId?: number;
    limit?: number;
  }): Promise<TicketDto[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.incidentId) {
      where.incidentId = BigInt(filters.incidentId);
    }

    if (filters.assignedToUserId) {
      where.assignedToUserId = filters.assignedToUserId;
    }

    if (filters.createdByUserId) {
      where.createdByUserId = filters.createdByUserId;
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      take: filters.limit || 100,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return Promise.all(tickets.map(async (ticket) => {
      const dto = this.mapTicketToDto(ticket);
      if (ticket.incidentUuid || ticket.incidentId) {
        dto.incident = await this.loadIncidentIfExists(ticket.incidentUuid, ticket.incidentId) || undefined;
      }
      return dto;
    }));
  }

  async findOne(id: number): Promise<TicketDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        events: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    const dto = this.mapTicketToDto(ticket);
    if (ticket.incidentUuid || ticket.incidentId) {
      dto.incident = await this.loadIncidentIfExists(ticket.incidentUuid, ticket.incidentId) || undefined;
    }
    return dto;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, userId: number): Promise<TicketDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Verificar usuario asignado si se cambia
    if (updateTicketDto.assignedToUserId !== undefined) {
      if (updateTicketDto.assignedToUserId !== null) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { id: updateTicketDto.assignedToUserId },
        });

        if (!assignedUser) {
          throw new BadRequestException(`Usuario asignado con ID ${updateTicketDto.assignedToUserId} no encontrado`);
        }
      }
    }

    const changedFields: any = {};
    if (updateTicketDto.title && updateTicketDto.title !== ticket.title) {
      changedFields.title = { from: ticket.title, to: updateTicketDto.title };
    }
    if (updateTicketDto.description !== undefined && updateTicketDto.description !== ticket.description) {
      changedFields.description = { from: ticket.description, to: updateTicketDto.description };
    }
    if (updateTicketDto.priority !== undefined && updateTicketDto.priority !== ticket.priority) {
      changedFields.priority = { from: ticket.priority, to: updateTicketDto.priority };
    }

    // Actualizar ticket y crear evento en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: BigInt(id) },
        data: updateTicketDto as any,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      // Manejar cambio de asignación
      if (updateTicketDto.assignedToUserId !== undefined) {
        const eventType = updateTicketDto.assignedToUserId === null 
          ? TicketEventType.UNASSIGNED 
          : TicketEventType.ASSIGNED;

        await tx.ticketEvent.create({
          data: {
            ticketId: BigInt(id),
            eventType,
            message: updateTicketDto.assignedToUserId === null
              ? 'Ticket desasignado'
              : `Asignado a usuario ID ${updateTicketDto.assignedToUserId}`,
            payload: { assignedToUserId: updateTicketDto.assignedToUserId },
            createdByUserId: userId,
          },
        });
      }

      // Crear evento de actualización si hay cambios
      if (Object.keys(changedFields).length > 0) {
        await tx.ticketEvent.create({
          data: {
            ticketId: BigInt(id),
            eventType: TicketEventType.UPDATED,
            message: 'Ticket actualizado',
            payload: changedFields,
            createdByUserId: userId,
          },
        });
      }

      return updatedTicket;
    });

    const dto = this.mapTicketToDto(result);
    if (result.incidentUuid || result.incidentId) {
      dto.incident = await this.loadIncidentIfExists(result.incidentUuid, result.incidentId) || undefined;
    }
    return dto;
  }

  async changeStatus(id: number, changeStatusDto: ChangeTicketStatusDto, userId: number): Promise<TicketDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    if (ticket.status === changeStatusDto.status) {
      throw new BadRequestException(`El ticket ya está en estado ${changeStatusDto.status}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: BigInt(id) },
        data: { status: changeStatusDto.status },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      await tx.ticketEvent.create({
        data: {
          ticketId: BigInt(id),
          eventType: TicketEventType.STATUS_CHANGED,
          fromStatus: ticket.status,
          toStatus: changeStatusDto.status,
          message: changeStatusDto.message || `Estado cambiado de ${ticket.status} a ${changeStatusDto.status}`,
          createdByUserId: userId,
        },
      });

      return updatedTicket;
    });

    const dto = this.mapTicketToDto(result);
    if (result.incidentUuid || result.incidentId) {
      dto.incident = await this.loadIncidentIfExists(result.incidentUuid, result.incidentId) || undefined;
    }
    return dto;
  }

  async addComment(id: number, addCommentDto: AddCommentDto, userId: number): Promise<TicketEventDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    const event = await this.prisma.ticketEvent.create({
      data: {
        ticketId: BigInt(id),
        eventType: TicketEventType.COMMENT,
        message: addCommentDto.message,
        createdByUserId: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return this.mapEventToDto(event);
  }

  async getEvents(id: number, limit: number = 50): Promise<TicketEventDto[]> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    const events = await this.prisma.ticketEvent.findMany({
      where: { ticketId: BigInt(id) },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return events.map((event: any) => this.mapEventToDto(event));
  }

  private mapTicketToDto(ticket: any): TicketDto {
    return {
      id: ticket.id.toString(),
      incidentUuid: ticket.incidentUuid,
      incidentId: ticket.incidentId ? ticket.incidentId.toString() : undefined,
      source: ticket.source,
      incidentType: ticket.incidentType,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdByUserId: ticket.createdByUserId,
      assignedToUserId: ticket.assignedToUserId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      recentEvents: ticket.events?.map((e: any) => this.mapEventToDto(e)),
    };
  }

  private mapEventToDto(event: any): TicketEventDto {
    return {
      id: event.id.toString(),
      ticketId: event.ticketId.toString(),
      eventType: event.eventType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      message: event.message,
      payload: event.payload,
      createdByUserId: event.createdByUserId,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
    };
  }
}
