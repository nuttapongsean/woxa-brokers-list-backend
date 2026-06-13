import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Broker } from './entities/broker.entity';
import { BrokersService } from './brokers.service';
import { BrokersController } from './brokers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Broker])],
  controllers: [BrokersController],
  providers: [BrokersService],
})
export class BrokersModule {}
