import { ApiProperty } from '@nestjs/swagger';

export class IncidentDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  uuid!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ required: false, nullable: true })
  subtype!: string | null;

  @ApiProperty({ required: false, nullable: true })
  city!: string | null;

  @ApiProperty({ required: false, nullable: true })
  street!: string | null;

  @ApiProperty({ required: false, nullable: true })
  category!: string | null;

  @ApiProperty({ required: false, nullable: true })
  priority!: number | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  pub_time!: Date;

  @ApiProperty({ required: false, nullable: true })
  reliability!: number | null;

  @ApiProperty({ required: false, nullable: true })
  confidence!: number | null;

  @ApiProperty()
  lat!: number;

  @ApiProperty()
  lon!: number;

  @ApiProperty({ required: false, description: 'Distancia al punto de consulta en metros' })
  distance?: number;
}
