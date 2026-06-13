import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { BrokerType } from '../entities/broker.entity';

export class CreateBrokerDto {
  @ApiProperty({ example: 'Exness' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({
    example: 'exness',
    description: 'Auto-generated from name if omitted',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @ApiProperty({ example: 'A leading multi-asset broker.' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ example: 'https://cdn.example.com/logos/exness.png' })
  @IsUrl()
  logoUrl!: string;

  @ApiProperty({ example: 'https://www.exness.com' })
  @IsUrl()
  website!: string;

  @ApiProperty({ enum: BrokerType, example: BrokerType.CFD })
  @IsEnum(BrokerType)
  brokerType!: BrokerType;
}
