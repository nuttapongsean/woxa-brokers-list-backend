import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateBrokerFeatureDto {
  @ApiProperty({ example: 'Zero Commission' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ example: 'Trade with zero commission on all instruments.' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
