import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
