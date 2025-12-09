import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { IncidentDto } from './dto/incident.dto';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOkResponse({ type: IncidentDto, isArray: true })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO datetime' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO datetime' })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<IncidentDto[]> {
    return this.incidentsService.findAll({
      type,
      category,
      status,
      city,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('near')
  @ApiOkResponse({ type: IncidentDto, isArray: true })
  async findNear(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('radius') radius?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ): Promise<IncidentDto[]> {
    if (!lat || !lon) {
      throw new BadRequestException('lat y lon son requeridos');
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = radius ? parseFloat(radius) : 1000;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      throw new BadRequestException('lat y lon deben ser números válidos');
    }

    if (Number.isNaN(radiusNum) || radiusNum <= 0) {
      throw new BadRequestException('radius debe ser un número mayor a 0');
    }

    if (limitNum !== undefined && (Number.isNaN(limitNum) || limitNum <= 0)) {
      throw new BadRequestException('limit debe ser un número mayor a 0');
    }

    return this.incidentsService.findNear({
      lat: latNum,
      lon: lonNum,
      radius: radiusNum,
      type,
      category,
      status,
      city,
      limit: limitNum,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: IncidentDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IncidentDto> {
    const incident = await this.incidentsService.findOne(id);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }
}
