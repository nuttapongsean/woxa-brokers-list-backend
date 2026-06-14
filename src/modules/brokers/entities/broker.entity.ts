import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrokerFeature } from './broker-feature.entity';
import { BrokerMetrics } from './broker-metrics.entity';
import { BrokerMarkets } from './broker-markets.entity';

export enum BrokerType {
  CFD = 'cfd',
  BOND = 'bond',
  STOCK = 'stock',
  CRYPTO = 'crypto',
}

@Entity('brokers')
export class Broker {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  logoUrl!: string;

  @Column()
  website!: string;

  @Column({ type: 'enum', enum: BrokerType })
  brokerType!: BrokerType;

  // BrokerCard
  @Column({ nullable: true, type: 'varchar' })
  imageUrl?: string;

  @Column({ nullable: true, type: 'varchar' })
  badge?: string;

  @Column({ nullable: true, type: 'varchar' })
  tag?: string;

  @Column({ nullable: true, type: 'varchar' })
  icon?: string;

  // BrokerHero
  @Column({ nullable: true, type: 'varchar' })
  grade?: string;

  @Column({ type: 'smallint', nullable: true })
  rating?: number;

  @Column({ nullable: true, type: 'varchar' })
  prospectusUrl?: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;

  // ContactCard
  @Column({ nullable: true, type: 'varchar' })
  contactAddress?: string;

  @Column({ nullable: true, type: 'varchar' })
  contactEmail?: string;

  @OneToMany(() => BrokerFeature, (f) => f.broker)
  features!: BrokerFeature[];

  @OneToOne(() => BrokerMetrics, (m) => m.broker)
  metrics?: BrokerMetrics;

  @OneToOne(() => BrokerMarkets, (m) => m.broker)
  markets?: BrokerMarkets;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
