import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBrokerMetricsDto {
  @ApiPropertyOptional({ example: '+34.2%' })
  @IsOptional()
  @IsString()
  aumGrowthYoY?: string;

  @ApiPropertyOptional({ example: '$18.4B' })
  @IsOptional()
  @IsString()
  liquidityAccess?: string;

  @ApiPropertyOptional({ example: 'Daily Average' })
  @IsOptional()
  @IsString()
  liquidityAccessSub?: string;

  @ApiPropertyOptional({ example: '94.7%' })
  @IsOptional()
  @IsString()
  clientRetention?: string;

  @ApiPropertyOptional({ example: '12-month rolling' })
  @IsOptional()
  @IsString()
  clientRetentionPeriod?: string;
}
