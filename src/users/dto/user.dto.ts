import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@alertas.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'VIEWER', enum: ['ADMIN', 'OPERATOR', 'VIEWER'] })
  @IsEnum(['ADMIN', 'OPERATOR', 'VIEWER'])
  @IsOptional()
  role?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'user@alertas.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'username', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'VIEWER', enum: ['ADMIN', 'OPERATOR', 'VIEWER'], required: false })
  @IsEnum(['ADMIN', 'OPERATOR', 'VIEWER'])
  @IsOptional()
  role?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastLogin: Date | null;
}
