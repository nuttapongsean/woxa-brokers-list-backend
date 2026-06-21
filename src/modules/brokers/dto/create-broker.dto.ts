import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
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
    example: 'exness-a1b2c',
    description: 'Auto-generated from name if omitted',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: BrokerType, example: BrokerType.CFD })
  @IsEnum(BrokerType)
  brokerType!: BrokerType;

  @ApiProperty({ example: 'A leading multi-asset broker with deep liquidity.' })
  @IsString()
  @MinLength(20)
  description!: string;

  @ApiProperty({ example: 'Exness is a global multi-asset broker...' })
  @IsString()
  longDescription!: string;

  @ApiProperty({ example: 'https://www.exness.com' })
  @IsUrl()
  website!: string;

  @ApiProperty({ example: '123 Finance Street, Bangkok, Thailand' })
  @IsString()
  contactAddress!: string;

  @ApiProperty({ example: 'support@exness.com' })
  @IsEmail()
  contactEmail!: string;

  @ApiPropertyOptional({
    description:
      'JSON-encoded array: [{"title":"...","description":"...","sortOrder":0}]',
    example:
      '[{"title":"Zero Commission","description":"Trade with zero commission."}]',
  })
  @IsOptional()
  @IsString()
  features?: string;
}
