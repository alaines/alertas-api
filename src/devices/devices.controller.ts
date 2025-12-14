import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  ChangeDeviceStatusDto,
  DeviceDto,
} from './dto/device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeviceType, DeviceStatus } from '@prisma/client';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOkResponse({ type: DeviceDto })
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @Request() req: any,
  ): Promise<DeviceDto> {
    return this.devicesService.create(createDeviceDto, req.user.id);
  }

  @Get()
  @ApiOkResponse({ type: DeviceDto, isArray: true })
  @ApiQuery({ name: 'type', enum: DeviceType, required: false })
  @ApiQuery({ name: 'status', enum: DeviceStatus, required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') type?: DeviceType,
    @Query('status') status?: DeviceStatus,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ): Promise<DeviceDto[]> {
    return this.devicesService.findAll({
      type,
      status,
      city,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: DeviceDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DeviceDto> {
    return this.devicesService.findOne(BigInt(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: DeviceDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Request() req: any,
  ): Promise<DeviceDto> {
    return this.devicesService.update(BigInt(id), updateDeviceDto, req.user.id);
  }

  @Post(':id/status')
  @ApiOkResponse({ type: DeviceDto })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeDeviceStatusDto,
    @Request() req: any,
  ): Promise<DeviceDto> {
    return this.devicesService.changeStatus(BigInt(id), changeStatusDto, req.user.id);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Device deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.devicesService.delete(BigInt(id));
    return { message: 'Device deleted successfully' };
  }
}
