import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { BrokerQueryDto } from './dto/broker-query.dto';

@ApiTags('brokers')
@Controller('brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all brokers (paginated, filterable by type)' })
  findAll(@Query() query: BrokerQueryDto) {
    return this.brokersService.findAll(query);
  }

  @Public()
  @Get('slugs')
  @ApiOperation({ summary: 'List all broker slugs (for static generation)' })
  findSlugs() {
    return this.brokersService.findSlugs();
  }

  @Public()
  @Get('types')
  @ApiOperation({
    summary: 'List distinct broker types that have at least one broker',
  })
  findTypes() {
    return this.brokersService.findTypes();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single broker by slug (with features, metrics, markets)',
  })
  findOne(@Param('slug') slug: string) {
    return this.brokersService.findOne(slug);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new broker' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateBrokerDto) {
    return this.brokersService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a broker' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrokerDto) {
    return this.brokersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a broker' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brokersService.remove(id);
  }
}
