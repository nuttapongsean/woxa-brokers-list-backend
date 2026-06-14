import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Broker } from './broker.entity';

@Entity('broker_markets')
export class BrokerMarkets {
  @PrimaryColumn('uuid')
  brokerId!: string;

  @OneToOne(() => Broker, (b) => b.markets)
  @JoinColumn({ name: 'brokerId' })
  broker!: Broker;

  @Column({ type: 'int', default: 0 })
  forexPairs!: number;

  @Column({ type: 'int', default: 0 })
  indices!: number;

  @Column({ type: 'int', default: 0 })
  commodities!: number;

  @Column({ type: 'int', default: 0 })
  equities!: number;

  @Column({ type: 'int', default: 0 })
  sovereignBonds!: number;

  @Column({ type: 'int', default: 0 })
  cryptoEtps!: number;
}
