import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('broker_features')
export class BrokerFeature {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  brokerId!: string;

  @ManyToOne(() => Broker, (b) => b.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brokerId' })
  broker!: Broker;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;
}
