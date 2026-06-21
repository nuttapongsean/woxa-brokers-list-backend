import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Broker } from './entities/broker.entity';
import { BrokerFeature } from './entities/broker-feature.entity';
import { BrokerMarkets } from './entities/broker-markets.entity';
import { BrokerMetrics } from './entities/broker-metrics.entity';
import { BrokersService } from './brokers.service';
import { BrokersController } from './brokers.controller';
import { StorageModule } from '../../shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Broker,
      BrokerFeature,
      BrokerMetrics,
      BrokerMarkets,
    ]),
    StorageModule,
  ],
  controllers: [BrokersController],
  providers: [BrokersService],
})
export class BrokersModule {}
