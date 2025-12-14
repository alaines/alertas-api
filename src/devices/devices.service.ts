import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateDeviceDto, 
  UpdateDeviceDto, 
  ChangeDeviceStatusDto, 
  DeviceDto 
} from './dto/device.dto';
import { DeviceType, DeviceStatus, DeviceEventType } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto, userId: number): Promise<DeviceDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear dispositivo
      const device = await tx.device.create({
        data: {
          name: createDeviceDto.name,
          type: createDeviceDto.type,
          brand: createDeviceDto.brand,
          model: createDeviceDto.model,
          serialNumber: createDeviceDto.serialNumber,
          installationYear: createDeviceDto.installationYear,
          manufactureYear: createDeviceDto.manufactureYear,
          latitude: createDeviceDto.latitude,
          longitude: createDeviceDto.longitude,
          address: createDeviceDto.address,
          ipAddress: createDeviceDto.ipAddress,
          username: createDeviceDto.username,
          password: createDeviceDto.password,
          status: createDeviceDto.status || DeviceStatus.ACTIVE,
          lastMaintenanceDate: createDeviceDto.lastMaintenanceDate 
            ? new Date(createDeviceDto.lastMaintenanceDate) 
            : null,
          notes: createDeviceDto.notes,
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

      // Registrar evento de creación
      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.CREATED,
          toStatus: device.status,
          description: 'Dispositivo creado',
          payload: JSON.parse(JSON.stringify(createDeviceDto)),
          createdByUserId: userId,
        },
      });

      return device;
    });

    return this.mapDeviceToDto(result);
  }

  async findAll(filters?: {
    type?: DeviceType;
    status?: DeviceStatus;
    city?: string;
    limit?: number;
  }): Promise<DeviceDto[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.city) {
      where.address = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    const devices = await this.prisma.device.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit && filters.limit > 0 ? filters.limit : 100,
    });

    return devices.map((device) => this.mapDeviceToDto(device));
  }

  async findOne(id: bigint): Promise<DeviceDto> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        createdBy: {
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

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.mapDeviceToDto(device, true);
  }

  async update(
    id: bigint,
    updateDeviceDto: UpdateDeviceDto,
    userId: number,
  ): Promise<DeviceDto> {
    // Verificar que existe
    await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      const device = await tx.device.update({
        where: { id },
        data: {
          ...(updateDeviceDto.name && { name: updateDeviceDto.name }),
          ...(updateDeviceDto.type && { type: updateDeviceDto.type }),
          ...(updateDeviceDto.brand !== undefined && { brand: updateDeviceDto.brand }),
          ...(updateDeviceDto.model !== undefined && { model: updateDeviceDto.model }),
          ...(updateDeviceDto.serialNumber !== undefined && { serialNumber: updateDeviceDto.serialNumber }),
          ...(updateDeviceDto.installationYear !== undefined && { installationYear: updateDeviceDto.installationYear }),
          ...(updateDeviceDto.manufactureYear !== undefined && { manufactureYear: updateDeviceDto.manufactureYear }),
          ...(updateDeviceDto.latitude !== undefined && { latitude: updateDeviceDto.latitude }),
          ...(updateDeviceDto.longitude !== undefined && { longitude: updateDeviceDto.longitude }),
          ...(updateDeviceDto.address !== undefined && { address: updateDeviceDto.address }),
          ...(updateDeviceDto.ipAddress !== undefined && { ipAddress: updateDeviceDto.ipAddress }),
          ...(updateDeviceDto.username !== undefined && { username: updateDeviceDto.username }),
          ...(updateDeviceDto.password !== undefined && { password: updateDeviceDto.password }),
          ...(updateDeviceDto.lastMaintenanceDate && { 
            lastMaintenanceDate: new Date(updateDeviceDto.lastMaintenanceDate) 
          }),
          ...(updateDeviceDto.notes !== undefined && { notes: updateDeviceDto.notes }),
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

      // Registrar evento de actualización
      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.UPDATED,
          description: 'Dispositivo actualizado',
          payload: JSON.parse(JSON.stringify(updateDeviceDto)),
          createdByUserId: userId,
        },
      });

      return device;
    });

    return this.mapDeviceToDto(result);
  }

  async changeStatus(
    id: bigint,
    changeStatusDto: ChangeDeviceStatusDto,
    userId: number,
  ): Promise<DeviceDto> {
    const current = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException('Device not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const device = await tx.device.update({
        where: { id },
        data: {
          status: changeStatusDto.status,
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

      // Registrar evento de cambio de estado
      await tx.deviceEvent.create({
        data: {
          deviceId: device.id,
          eventType: DeviceEventType.STATUS_CHANGED,
          fromStatus: current.status,
          toStatus: changeStatusDto.status,
          description: changeStatusDto.description || `Estado cambiado de ${current.status} a ${changeStatusDto.status}`,
          payload: JSON.parse(JSON.stringify(changeStatusDto)),
          createdByUserId: userId,
        },
      });

      return device;
    });

    return this.mapDeviceToDto(result);
  }

  async delete(id: bigint): Promise<void> {
    await this.findOne(id);
    await this.prisma.device.delete({
      where: { id },
    });
  }

  private mapDeviceToDto(device: any, includeEvents = false): DeviceDto {
    return {
      id: device.id.toString(),
      name: device.name,
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      installationYear: device.installationYear,
      manufactureYear: device.manufactureYear,
      latitude: device.latitude,
      longitude: device.longitude,
      address: device.address,
      ipAddress: device.ipAddress,
      username: device.username,
      status: device.status,
      lastMaintenanceDate: device.lastMaintenanceDate?.toISOString() || null,
      notes: device.notes,
      createdByUserId: device.createdByUserId,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
      createdBy: device.createdBy,
      ...(includeEvents && device.events && {
        recentEvents: device.events.map((event: any) => ({
          id: event.id.toString(),
          deviceId: event.deviceId.toString(),
          eventType: event.eventType,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          description: event.description,
          payload: event.payload,
          createdByUserId: event.createdByUserId,
          createdAt: event.createdAt.toISOString(),
          createdBy: event.createdBy,
        })),
      }),
    };
  }
}
