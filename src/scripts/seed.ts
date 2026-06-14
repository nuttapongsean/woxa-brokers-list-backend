import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { Broker, BrokerType } from '../modules/brokers/entities/broker.entity';
import { BrokerFeature } from '../modules/brokers/entities/broker-feature.entity';
import { BrokerMarkets } from '../modules/brokers/entities/broker-markets.entity';
import { BrokerMetrics } from '../modules/brokers/entities/broker-metrics.entity';

const BROKERS: Array<{
  broker: Omit<
    Broker,
    'features' | 'metrics' | 'markets' | 'createdAt' | 'updatedAt' | 'deletedAt'
  >;
  features: Array<Omit<BrokerFeature, 'id' | 'brokerId' | 'broker'>>;
  metrics: Omit<BrokerMetrics, 'brokerId' | 'broker'>;
  markets: Omit<BrokerMarkets, 'brokerId' | 'broker'>;
}> = [
  {
    broker: {
      id: randomUUID(),
      name: 'Exness',
      slug: 'exness',
      description:
        'Global multi-asset broker offering tight spreads and fast execution.',
      longDescription:
        "Exness is one of the world's largest retail forex brokers by trading volume. Founded in 2008, the company offers trading in forex, metals, energies, cryptocurrencies, stocks, and indices through MetaTrader 4 and MetaTrader 5 platforms.",
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Exness_logo.svg/320px-Exness_logo.svg.png',
      imageUrl:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      website: 'https://www.exness.com',
      brokerType: BrokerType.CFD,
      badge: 'Top Rated',
      tag: 'CySEC Regulated',
      icon: 'trending-up',
      grade: 'SOVEREIGN GRADE A+',
      rating: 5,
      contactAddress: 'Exness B.V., Kaya Richard J. Beaujon Z/N, Curacao',
      contactEmail: 'support@exness.com',
    },
    features: [
      {
        title: 'Zero Commission',
        description:
          'Trade with zero commission on all Standard account instruments.',
        sortOrder: 0,
      },
      {
        title: 'Instant Withdrawal',
        description: 'Withdraw funds instantly 24/7 with no processing delays.',
        sortOrder: 1,
      },
      {
        title: 'Negative Balance Protection',
        description: 'Your account balance can never fall below zero.',
        sortOrder: 2,
      },
      {
        title: 'High Leverage',
        description: 'Access leverage up to 1:Unlimited on select instruments.',
        sortOrder: 3,
      },
    ],
    metrics: {
      aumGrowthYoY: '+41.2%',
      liquidityAccess: '$4.2T',
      liquidityAccessSub: 'Monthly Volume',
      clientRetention: '92.3%',
      clientRetentionPeriod: '12-month rolling',
    },
    markets: {
      forexPairs: 107,
      indices: 14,
      commodities: 9,
      equities: 0,
      sovereignBonds: 0,
      cryptoEtps: 13,
    },
  },
  {
    broker: {
      id: randomUUID(),
      name: 'XM Group',
      slug: 'xm-group',
      description:
        'Award-winning CFD broker with over 10 million clients worldwide.',
      longDescription:
        'XM is a globally operating forex and CFD broker. Founded in 2009, XM has grown to serve more than 10 million clients from 190+ countries, offering access to over 1,000 instruments across multiple asset classes.',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/XM_logo.svg/320px-XM_logo.svg.png',
      imageUrl:
        'https://images.unsplash.com/photo-1642790551116-18e150f248e5?w=800',
      website: 'https://www.xm.com',
      brokerType: BrokerType.CFD,
      badge: 'Award Winner',
      tag: 'ASIC Regulated',
      icon: 'award',
      grade: 'INSTITUTIONAL GRADE A',
      rating: 4,
      contactAddress:
        'Trading Point of Financial Instruments Ltd, Limitation, Cyprus',
      contactEmail: 'support@xm.com',
    },
    features: [
      {
        title: 'No Requotes',
        description:
          'All orders are filled at the requested price with no requotes.',
        sortOrder: 0,
      },
      {
        title: '1000+ Instruments',
        description:
          'Access over 1,000 trading instruments across 8 asset classes.',
        sortOrder: 1,
      },
      {
        title: '$30 Welcome Bonus',
        description:
          'Start trading with a $30 no-deposit bonus upon registration.',
        sortOrder: 2,
      },
    ],
    metrics: {
      aumGrowthYoY: '+28.7%',
      liquidityAccess: '$18.4B',
      liquidityAccessSub: 'Daily Average',
      clientRetention: '94.7%',
      clientRetentionPeriod: '12-month rolling',
    },
    markets: {
      forexPairs: 57,
      indices: 22,
      commodities: 15,
      equities: 1300,
      sovereignBonds: 0,
      cryptoEtps: 32,
    },
  },
  {
    broker: {
      id: randomUUID(),
      name: 'IC Markets',
      slug: 'ic-markets',
      description:
        'True ECN broker with raw spreads from 0.0 pips and ultra-fast execution.',
      longDescription:
        "IC Markets is one of the world's leading true ECN forex brokers. With raw spreads starting from 0.0 pips and execution speeds averaging 40ms, IC Markets is the preferred choice for scalpers and algorithmic traders.",
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/IC_Markets_logo.svg/320px-IC_Markets_logo.svg.png',
      imageUrl:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      website: 'https://www.icmarkets.com',
      brokerType: BrokerType.CFD,
      badge: 'ECN Broker',
      tag: 'ASIC Regulated',
      icon: 'zap',
      grade: 'PROFESSIONAL GRADE A',
      rating: 5,
      contactAddress: 'Level 6, 309 Kent Street, Sydney NSW 2000, Australia',
      contactEmail: 'support@icmarkets.com',
    },
    features: [
      {
        title: 'Raw Spreads from 0.0 pips',
        description:
          'Access true interbank spreads with no markup on ECN accounts.',
        sortOrder: 0,
      },
      {
        title: 'Ultra-Fast Execution',
        description: 'Average execution speed of 40ms with co-located servers.',
        sortOrder: 1,
      },
      {
        title: 'Deep Liquidity',
        description:
          'Connected to 25+ liquidity providers for best price discovery.',
        sortOrder: 2,
      },
      {
        title: 'Algorithmic Trading',
        description:
          'Full support for EAs, VPS hosting, and automated strategies.',
        sortOrder: 3,
      },
    ],
    metrics: {
      aumGrowthYoY: '+34.2%',
      liquidityAccess: '$22.1B',
      liquidityAccessSub: 'Daily Average',
      clientRetention: '96.1%',
      clientRetentionPeriod: '12-month rolling',
    },
    markets: {
      forexPairs: 61,
      indices: 25,
      commodities: 22,
      equities: 1600,
      sovereignBonds: 10,
      cryptoEtps: 13,
    },
  },
  {
    broker: {
      id: randomUUID(),
      name: 'Binance',
      slug: 'binance',
      description: "World's largest cryptocurrency exchange by trading volume.",
      longDescription:
        "Binance is the world's leading blockchain ecosystem and cryptocurrency infrastructure provider with a financial product suite that includes the largest digital-asset exchange by volume.",
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Binance_Logo.png/320px-Binance_Logo.png',
      imageUrl:
        'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
      website: 'https://www.binance.com',
      brokerType: BrokerType.CRYPTO,
      badge: 'Largest Exchange',
      tag: 'Global',
      icon: 'bitcoin',
      grade: 'INSTITUTIONAL GRADE S',
      rating: 4,
      contactAddress: 'Binance Holdings Ltd, Cayman Islands',
      contactEmail: 'support@binance.com',
    },
    features: [
      {
        title: '350+ Cryptocurrencies',
        description: 'Trade over 350 cryptocurrencies with deep liquidity.',
        sortOrder: 0,
      },
      {
        title: 'Low Trading Fees',
        description: 'Spot trading fees as low as 0.1% with BNB discounts.',
        sortOrder: 1,
      },
      {
        title: 'Futures Trading',
        description: 'Up to 125x leverage on crypto futures contracts.',
        sortOrder: 2,
      },
      {
        title: 'Staking & Earn',
        description:
          'Earn passive income through staking and flexible savings.',
        sortOrder: 3,
      },
    ],
    metrics: {
      aumGrowthYoY: '+52.8%',
      liquidityAccess: '$76B',
      liquidityAccessSub: 'Daily Volume',
      clientRetention: '88.4%',
      clientRetentionPeriod: '12-month rolling',
    },
    markets: {
      forexPairs: 0,
      indices: 0,
      commodities: 0,
      equities: 0,
      sovereignBonds: 0,
      cryptoEtps: 350,
    },
  },
  {
    broker: {
      id: randomUUID(),
      name: 'Interactive Brokers',
      slug: 'interactive-brokers',
      description:
        'Professional-grade broker for stocks, options, futures, forex, and bonds.',
      longDescription:
        'Interactive Brokers is a leading global brokerage firm offering access to 150 markets in 33 countries. Known for its sophisticated trading platform and low commissions, it is the preferred choice for professional and institutional traders.',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Interactive_Brokers_logo.svg/320px-Interactive_Brokers_logo.svg.png',
      imageUrl:
        'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=800',
      website: 'https://www.interactivebrokers.com',
      brokerType: BrokerType.STOCK,
      badge: 'Professional Grade',
      tag: 'SEC & FINRA Regulated',
      icon: 'bar-chart-2',
      grade: 'SOVEREIGN GRADE S+',
      rating: 5,
      contactAddress: '1 Pickwick Plaza, Greenwich, CT 06830, USA',
      contactEmail: 'ibservice@interactivebrokers.com',
    },
    features: [
      {
        title: '150 Global Markets',
        description:
          'Trade on 150 markets across 33 countries from one account.',
        sortOrder: 0,
      },
      {
        title: 'Lowest Margin Rates',
        description: 'Industry-leading margin rates starting from 5.83%.',
        sortOrder: 1,
      },
      {
        title: 'Advanced Order Types',
        description:
          'Over 100 order types and algorithms for precise execution.',
        sortOrder: 2,
      },
      {
        title: 'SIPC Protection',
        description: 'Up to $500,000 SIPC protection for securities accounts.',
        sortOrder: 3,
      },
    ],
    metrics: {
      aumGrowthYoY: '+19.4%',
      liquidityAccess: '$380B',
      liquidityAccessSub: 'Client Assets',
      clientRetention: '97.2%',
      clientRetentionPeriod: '12-month rolling',
    },
    markets: {
      forexPairs: 100,
      indices: 30,
      commodities: 35,
      equities: 150000,
      sovereignBonds: 1000000,
      cryptoEtps: 15,
    },
  },
];

async function seed(dataSource: DataSource) {
  const brokerRepo = dataSource.getRepository(Broker);

  for (const { broker, features, metrics, markets } of BROKERS) {
    const existing = await brokerRepo.findOne({ where: { slug: broker.slug } });
    if (existing) {
      console.log(`  skip  ${broker.slug} (already exists)`);
      continue;
    }

    await dataSource.transaction(async (manager) => {
      await manager.save(Broker, broker);

      if (features.length) {
        await manager.save(
          BrokerFeature,
          features.map((f) => ({
            ...f,
            id: randomUUID(),
            brokerId: broker.id,
          })),
        );
      }

      await manager.save(BrokerMetrics, { ...metrics, brokerId: broker.id });
      await manager.save(BrokerMarkets, { ...markets, brokerId: broker.id });
    });

    console.log(`  ✓     ${broker.slug}`);
  }
}

AppDataSource.initialize()
  .then((ds) => seed(ds))
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
