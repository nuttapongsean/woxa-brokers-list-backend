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
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { UploadedFile } from '../../shared/storage/types';
import { StripDotKeysInterceptor } from '../../common/interceptors/strip-dot-keys.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { BrokerQueryDto } from './dto/broker-query.dto';

interface BrokerFiles {
  logo?: UploadedFile[];
  coverImage?: UploadedFile[];
  prospectus?: UploadedFile[];
}

const brokerFileFields = FileFieldsInterceptor([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'prospectus', maxCount: 1 },
]);

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
  @Get('suggest-slug')
  @ApiOperation({ summary: 'Generate a unique slug from a broker name' })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Broker name to slugify',
  })
  suggestSlug(@Query('name') name: string) {
    return this.brokersService.suggestSlug(name);
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
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new broker' })
  @ApiResponse({ status: 201 })
  @UseInterceptors(brokerFileFields, StripDotKeysInterceptor)
  create(
    @UploadedFiles() files: BrokerFiles,
    @Body() dto: CreateBrokerDto,
    @Req() req: Request,
  ) {
    return this.brokersService.create(
      dto,
      (req as Request & { dotFields: Record<string, string> }).dotFields ?? {},
      files,
    );
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a broker' })
  @UseInterceptors(brokerFileFields, StripDotKeysInterceptor)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: BrokerFiles,
    @Body() dto: UpdateBrokerDto,
    @Req() req: Request,
  ) {
    return this.brokersService.update(
      id,
      dto,
      (req as Request & { dotFields: Record<string, string> }).dotFields ?? {},
      files,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a broker' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brokersService.remove(id);
  }
}
