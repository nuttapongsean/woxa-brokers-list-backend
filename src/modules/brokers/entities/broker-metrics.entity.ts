import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('broker_metrics')
export class BrokerMetrics {
  @PrimaryColumn('uuid')
  brokerId!: string;

  @OneToOne(() => Broker, (b) => b.metrics)
  @JoinColumn({ name: 'brokerId' })
  broker!: Broker;

  @Column({ nullable: true, type: 'varchar' })
  aumGrowthYoY?: string;

  @Column({ nullable: true, type: 'varchar' })
  liquidityAccess?: string;

  @Column({ nullable: true, type: 'varchar' })
  liquidityAccessSub?: string;

  @Column({ nullable: true, type: 'varchar' })
  clientRetention?: string;

  @Column({ nullable: true, type: 'varchar' })
  clientRetentionPeriod?: string;
}
