import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentDto } from './dto/incident.dto';

interface FindIncidentsParams {
  type?: string;
  category?: string;
  status?: string;
  city?: string;
  limit?: number;
  from?: string;
  to?: string;
}

interface FindNearParams {
  lat: number;
  lon: number;
  radius: number; // metros
  type?: string;
  category?: string;
  status?: string;
  city?: string;
  limit?: number;
}

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindIncidentsParams): Promise<IncidentDto[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.type) {
      where.push(`type = $${idx++}`);
      values.push(params.type);
    }
    if (params.category) {
      where.push(`category = $${idx++}`);
      values.push(params.category);
    }
    if (params.status) {
      where.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.city) {
      where.push(`city = $${idx++}`);
      values.push(params.city);
    }
    if (params.from) {
      where.push(`pub_time >= $${idx++}`);
      values.push(params.from);
    }
    if (params.to) {
      where.push(`pub_time <= $${idx++}`);
      values.push(params.to);
    }

    const limit =
      params.limit && params.limit > 0 && params.limit <= 500
        ? params.limit
        : 100;

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT
        id::int AS id,
        uuid,
        type,
        subtype,
        city,
        street,
        category,
        priority,
        status,
        pub_time,
        reliability,
        confidence,
        ST_Y(geom::geometry) AS lat,
        ST_X(geom::geometry) AS lon
      FROM waze_incidents
      ${whereSql}
      ORDER BY pub_time DESC
      LIMIT ${limit};
    `;

    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(query, ...values);
    return rows;
  }

  async findOne(id: number): Promise<IncidentDto | null> {
    const query = `
      SELECT
        id::int AS id,
        uuid,
        type,
        subtype,
        city,
        street,
        category,
        priority,
        status,
        pub_time,
        reliability,
        confidence,
        ST_Y(geom::geometry) AS lat,
        ST_X(geom::geometry) AS lon
      FROM waze_incidents
      WHERE id = $1;
    `;

    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(query, id);
    if (!rows.length) return null;
    return rows[0];
  }

  async findNear(params: FindNearParams): Promise<IncidentDto[]> {
    const { lat, lon, radius } = params;

    let whereConditions: string[] = [
      `ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
        ${radius}
      )`,
    ];
    const values: any[] = [];
    let idx = 1;

    if (params.type) {
      whereConditions.push(`type = $${idx++}`);
      values.push(params.type);
    }
    if (params.category) {
      whereConditions.push(`category = $${idx++}`);
      values.push(params.category);
    }
    if (params.status) {
      whereConditions.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.city) {
      whereConditions.push(`city = $${idx++}`);
      values.push(params.city);
    }

    const limit =
      params.limit && params.limit > 0 && params.limit <= 500
        ? params.limit
        : 100;

    const whereSql = whereConditions.join(' AND ');

    const query = `
      SELECT
        id::int AS id,
        uuid,
        type,
        subtype,
        city,
        street,
        category,
        priority,
        status,
        pub_time,
        reliability,
        confidence,
        ST_Y(geom::geometry) AS lat,
        ST_X(geom::geometry) AS lon,
        ST_Distance(
          geom,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
        ) AS distance
      FROM waze_incidents
      WHERE ${whereSql}
      ORDER BY distance ASC
      LIMIT ${limit};
    `;

    const rows = await this.prisma.$queryRawUnsafe<IncidentDto[]>(query, ...values);
    return rows;
  }
}
