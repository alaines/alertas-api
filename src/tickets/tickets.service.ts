import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, ChangeTicketStatusDto, AddCommentDto, TicketDto, TicketEventDto } from './dto/ticket.dto';
import { TicketStatus, TicketEventType } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, userId: number): Promise<TicketDto> {
    // Verificar que el incidente existe
    const incident = await this.prisma.wazeIncident.findUnique({
      where: { id: BigInt(createTicketDto.incidentId) },
    });

    if (!incident) {
      throw new NotFoundException(`Incidente con ID ${createTicketDto.incidentId} no encontrado`);
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
          incidentId: BigInt(createTicketDto.incidentId),
          title: createTicketDto.title,
          description: createTicketDto.description,
          priority: createTicketDto.priority,
          createdByUserId: userId,
          assignedToUserId: createTicketDto.assignedToUserId,
          status: TicketStatus.OPEN,
        },
        include: {
          incident: true,
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
    incidentId?: number;
    assignedToUserId?: number;
    createdByUserId?: number;
    limit?: number;
  }): Promise<TicketDto[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
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
        incident: true,
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

    return tickets.map(ticket => this.mapTicketToDto(ticket));
  }

  async findOne(id: number): Promise<TicketDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: BigInt(id) },
      include: {
        incident: true,
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

    return this.mapTicketToDto(ticket);
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
          incident: true,
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

    return this.mapTicketToDto(result);
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
          incident: true,
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

    return this.mapTicketToDto(result);
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

    return events.map(event => this.mapEventToDto(event));
  }

  private mapTicketToDto(ticket: any): TicketDto {
    return {
      id: ticket.id.toString(),
      incidentId: ticket.incidentId.toString(),
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdByUserId: ticket.createdByUserId,
      assignedToUserId: ticket.assignedToUserId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      incident: ticket.incident ? {
        id: ticket.incident.id.toString(),
        uuid: ticket.incident.uuid,
        type: ticket.incident.type,
        category: ticket.incident.category,
        city: ticket.incident.city,
        street: ticket.incident.street,
        status: ticket.incident.status,
      } : undefined,
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
