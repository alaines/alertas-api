import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsInt, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max,
  IsLatitude,
  IsLongitude,
  IsDateString,
  MinLength
} from 'class-validator';
import { DeviceType, DeviceStatus } from '@prisma/client';

export class CreateDeviceDto {
  @ApiProperty({ description: 'Nombre o identificador del dispositivo', example: 'Cámara Av. Principal #1' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ 
    enum: DeviceType, 
    description: 'Tipo de dispositivo',
    example: 'CAMERA'
  })
  @IsEnum(DeviceType)
  type!: DeviceType;

  @ApiPropertyOptional({ description: 'Marca del dispositivo', example: 'Hikvision' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del dispositivo', example: 'DS-2CD2047G2-L' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Número de serie', example: 'SN123456789' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Año de instalación', example: 2024, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  installationYear?: number;

  @ApiPropertyOptional({ description: 'Año de fabricación', example: 2023, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  manufactureYear?: number;

  @ApiPropertyOptional({ description: 'Latitud', example: -12.046374 })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud', example: -77.042793 })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Dirección física', example: 'Av. Javier Prado 123, San Isidro' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Dirección IP', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Usuario de acceso', example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Contraseña de acceso', example: 'secure_password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ 
    enum: DeviceStatus, 
    description: 'Estado del dispositivo',
    example: 'ACTIVE',
    default: 'ACTIVE'
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ description: 'Fecha del último mantenimiento (ISO 8601)', example: '2025-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Notas u observaciones', example: 'Requiere limpieza de lente cada 3 meses' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: 'Nombre o identificador del dispositivo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: DeviceType, description: 'Tipo de dispositivo' })
  @IsOptional()
  @IsEnum(DeviceType)
  type?: DeviceType;

  @ApiPropertyOptional({ description: 'Marca del dispositivo' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo del dispositivo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Número de serie' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Año de instalación', minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  installationYear?: number;

  @ApiPropertyOptional({ description: 'Año de fabricación', minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  manufactureYear?: number;

  @ApiPropertyOptional({ description: 'Latitud' })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud' })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Dirección física' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Dirección IP' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Usuario de acceso' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Contraseña de acceso' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Fecha del último mantenimiento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Notas u observaciones' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeDeviceStatusDto {
  @ApiProperty({ 
    enum: DeviceStatus, 
    description: 'Nuevo estado del dispositivo',
    example: 'MAINTENANCE'
  })
  @IsEnum(DeviceStatus)
  status!: DeviceStatus;

  @ApiPropertyOptional({ description: 'Descripción del cambio', example: 'Enviado a mantenimiento preventivo' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DeviceDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Cámara Av. Principal #1' })
  name!: string;

  @ApiProperty({ enum: DeviceType, example: 'CAMERA' })
  type!: DeviceType;

  @ApiPropertyOptional({ example: 'Hikvision' })
  brand?: string | null;

  @ApiPropertyOptional({ example: 'DS-2CD2047G2-L' })
  model?: string | null;

  @ApiPropertyOptional({ example: 'SN123456789' })
  serialNumber?: string | null;

  @ApiPropertyOptional({ example: 2024 })
  installationYear?: number | null;

  @ApiPropertyOptional({ example: 2023 })
  manufactureYear?: number | null;

  @ApiPropertyOptional({ example: -12.046374 })
  latitude?: number | null;

  @ApiPropertyOptional({ example: -77.042793 })
  longitude?: number | null;

  @ApiPropertyOptional({ example: 'Av. Javier Prado 123, San Isidro' })
  address?: string | null;

  @ApiPropertyOptional({ example: '192.168.1.100' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ example: 'admin' })
  username?: string | null;

  @ApiProperty({ enum: DeviceStatus, example: 'ACTIVE' })
  status!: DeviceStatus;

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00.000Z' })
  lastMaintenanceDate?: string | null;

  @ApiPropertyOptional({ example: 'Requiere limpieza de lente cada 3 meses' })
  notes?: string | null;

  @ApiProperty({ example: 1 })
  createdByUserId!: number;

  @ApiProperty({ example: '2025-12-14T07:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-12-14T07:00:00.000Z' })
  updatedAt!: string;

  @ApiPropertyOptional()
  createdBy?: {
    id: number;
    fullName: string;
    username: string;
  };

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  recentEvents?: any[];
}
