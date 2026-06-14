import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BrokerType } from '../entities/broker.entity';
import { CreateBrokerFeatureDto } from './create-broker-feature.dto';
import { CreateBrokerMarketsDto } from './create-broker-markets.dto';
import { CreateBrokerMetricsDto } from './create-broker-metrics.dto';

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

  // BrokerCard
  @ApiPropertyOptional({ example: 'https://cdn.example.com/images/exness-cover.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Premium TIER' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'SEC Regulated' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 'shield' })
  @IsOptional()
  @IsString()
  icon?: string;

  // BrokerHero
  @ApiPropertyOptional({ example: 'SOVEREIGN GRADE A+' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/docs/prospectus.pdf' })
  @IsOptional()
  @IsUrl()
  prospectusUrl?: string;

  @ApiPropertyOptional({ example: 'Exness is a global multi-asset broker...' })
  @IsOptional()
  @IsString()
  longDescription?: string;

  // ContactCard
  @ApiPropertyOptional({ example: '123 Finance Street, Bangkok, Thailand' })
  @IsOptional()
  @IsString()
  contactAddress?: string;

  @ApiPropertyOptional({ example: 'support@exness.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  // Nested relations
  @ApiPropertyOptional({ type: [CreateBrokerFeatureDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateBrokerFeatureDto)
  features?: CreateBrokerFeatureDto[];

  @ApiPropertyOptional({ type: CreateBrokerMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBrokerMetricsDto)
  metrics?: CreateBrokerMetricsDto;

  @ApiPropertyOptional({ type: CreateBrokerMarketsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBrokerMarketsDto)
  markets?: CreateBrokerMarketsDto;
}
