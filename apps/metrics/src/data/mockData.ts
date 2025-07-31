import {
  PaymentsMetric,
  DailyMetric,
  WeeklyMetric,
  Token,
  Operator,
  TokenMetric,
  OperatorMetric,
} from "../types/metrics";

// Mock overall payments metrics
export const paymentsMetric: PaymentsMetric = {
  id: "payments_network_stats",
  totalRails: BigInt("847293"),
  totalOperators: BigInt("1247"),
  totalTokens: BigInt("89"),
  totalAccounts: BigInt("42837"),
  totalFilBurned: BigInt("1847293000000000000000000"), // 1.8M FIL in wei
  totalZeroRateRails: BigInt("134829"),
  totalActiveRails: BigInt("98473"),
  totalTerminatedRails: BigInt("748820"),
  totalFinalizedRails: BigInt("648293"),
  uniquePayers: BigInt("28473"),
  uniquePayees: BigInt("31948"),
};

// Generate mock daily metrics for the last 30 days
export const dailyMetrics: DailyMetric[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const timestamp = Math.floor(date.getTime() / 1000);

  return {
    id: timestamp.toString(),
    timestamp: BigInt(timestamp),
    date: date.toISOString().split("T")[0],
    filBurned: BigInt(Math.floor(Math.random() * 50000 + 10000)) * 1000000000000000000n, // Random FIL amount
    railsCreated: BigInt(Math.floor(Math.random() * 500 + 100)),
    totalRailSettlements: BigInt(Math.floor(Math.random() * 400 + 80)),
    railsTerminated: BigInt(Math.floor(Math.random() * 50 + 10)),
    railsFinalized: BigInt(Math.floor(Math.random() * 300 + 60)),
    activeRailsCount: BigInt(Math.floor(Math.random() * 2000 + 1000)),
    uniquePayers: BigInt(Math.floor(Math.random() * 200 + 50)),
    uniquePayees: BigInt(Math.floor(Math.random() * 250 + 60)),
    uniqueOperators: BigInt(Math.floor(Math.random() * 30 + 10)),
    newAccounts: BigInt(Math.floor(Math.random() * 100 + 20)),
  };
});

// Generate mock weekly metrics for the last 12 weeks
export const weeklyMetrics: WeeklyMetric[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (11 - i) * 7);
  const timestamp = Math.floor(date.getTime() / 1000);

  return {
    id: timestamp.toString(),
    timestamp: BigInt(timestamp),
    week: BigInt(i + 1),
    filBurned: BigInt(Math.floor(Math.random() * 300000 + 100000)) * 1000000000000000000n,
    railsCreated: BigInt(Math.floor(Math.random() * 3000 + 1000)),
    totalRailSettlements: BigInt(Math.floor(Math.random() * 2500 + 800)),
    railsTerminated: BigInt(Math.floor(Math.random() * 300 + 100)),
    railsFinalized: BigInt(Math.floor(Math.random() * 2200 + 700)),
    activeRailsCount: BigInt(Math.floor(Math.random() * 15000 + 8000)),
    uniquePayers: BigInt(Math.floor(Math.random() * 1500 + 500)),
    uniquePayees: BigInt(Math.floor(Math.random() * 2000 + 800)),
    uniqueOperators: BigInt(Math.floor(Math.random() * 200 + 80)),
    newAccounts: BigInt(Math.floor(Math.random() * 700 + 200)),
  };
});

// Mock top tokens
export const topTokens: Token[] = [
  {
    id: "0x1",
    name: "Filecoin",
    symbol: "FIL",
    decimals: BigInt(18),
    Volume: BigInt("45000000000000000000000000"), // 45M FIL
    totalDeposits: BigInt("12000000000000000000000000"),
    totalWithdrawals: BigInt("8000000000000000000000000"),
    totalSettledAmount: BigInt("35000000000000000000000000"),
    userFunds: BigInt("2847300000000000000000000"),
    operatorCommission: BigInt("350000000000000000000000"),
  },
  {
    id: "0x2",
    name: "USD Coin",
    symbol: "USDC",
    decimals: BigInt(6),
    Volume: BigInt("89000000000000"), // 89M USDC
    totalDeposits: BigInt("25000000000000"),
    totalWithdrawals: BigInt("18000000000000"),
    totalSettledAmount: BigInt("67000000000000"),
    userFunds: BigInt("5847300000000"),
    operatorCommission: BigInt("670000000000"),
  },
  {
    id: "0x3",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: BigInt(8),
    Volume: BigInt("1200000000000"), // 12K WBTC
    totalDeposits: BigInt("400000000000"),
    totalWithdrawals: BigInt("250000000000"),
    totalSettledAmount: BigInt("950000000000"),
    userFunds: BigInt("150000000000"),
    operatorCommission: BigInt("12000000000"),
  },
  {
    id: "0x4",
    name: "Ethereum",
    symbol: "ETH",
    decimals: BigInt(18),
    Volume: BigInt("8500000000000000000000"), // 8.5K ETH
    totalDeposits: BigInt("3200000000000000000000"),
    totalWithdrawals: BigInt("2100000000000000000000"),
    totalSettledAmount: BigInt("6300000000000000000000"),
    userFunds: BigInt("1100000000000000000000"),
    operatorCommission: BigInt("85000000000000000000"),
  },
];

// Generate mock daily token metrics for top tokens
export const generateDailyTokenMetrics = (tokens: Token[], days: number = 30): TokenMetric[] => {
  const metrics: TokenMetric[] = [];

  tokens.forEach((token) => {
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const timestamp = Math.floor(date.getTime() / 1000);

      const baseVolume = Number(token.Volume) / 365; // Average daily volume
      const randomMultiplier = 0.7 + Math.random() * 0.6; // 70% to 130% of base

      metrics.push({
        id: `${token.id}_${timestamp}`,
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
        },
        timestamp: BigInt(timestamp),
        date: date.toISOString().split("T")[0],
        volume: BigInt(Math.floor(Number(baseVolume) * randomMultiplier)),
        deposit: BigInt(Math.floor((Number(token.totalDeposits) / 365) * randomMultiplier)),
        withdrawal: BigInt(Math.floor((Number(token.totalWithdrawals) / 365) * randomMultiplier)),
        settledAmount: BigInt(Math.floor((Number(token.totalSettledAmount) / 365) * randomMultiplier)),
        commissionPaid: BigInt(Math.floor((Number(token.operatorCommission) / 365) * randomMultiplier)),
        activeRailsCount: BigInt(Math.floor(Math.random() * 1000 + 500)),
        uniqueHolders: BigInt(Math.floor(Math.random() * 200 + 100)),
        totalLocked: BigInt(Math.floor(Number(token.userFunds) * (0.8 + Math.random() * 0.4))),
      });
    }
  });

  return metrics;
};

// Mock top operators
export const topOperators: Operator[] = [
  {
    id: "0xa1",
    address: "0xabc123...",
    totalRails: BigInt("15847"),
    totalCommission: BigInt("1200000000000000000000"), // 1.2K FIL
    totalApprovals: BigInt("2847"),
    Volume: BigInt("22000000000000000000000000"), // 22M FIL
  },
  {
    id: "0xa2",
    address: "0xdef456...",
    totalRails: BigInt("12934"),
    totalCommission: BigInt("980000000000000000000"), // 980 FIL
    totalApprovals: BigInt("2134"),
    Volume: BigInt("18500000000000000000000000"), // 18.5M FIL
  },
  {
    id: "0xa3",
    address: "0x789ghi...",
    totalRails: BigInt("8765"),
    totalCommission: BigInt("650000000000000000000"), // 650 FIL
    totalApprovals: BigInt("1456"),
    Volume: BigInt("12300000000000000000000000"), // 12.3M FIL
  },
  {
    id: "0xa4",
    address: "0x456jkl...",
    totalRails: BigInt("6543"),
    totalCommission: BigInt("420000000000000000000"), // 420 FIL
    totalApprovals: BigInt("987"),
    Volume: BigInt("8900000000000000000000000"), // 8.9M FIL
  },
];

// Generate mock daily operator metrics for top operators
export const generateDailyOperatorMetrics = (operators: Operator[], days: number = 30): OperatorMetric[] => {
  const metrics: OperatorMetric[] = [];

  operators.forEach((operator) => {
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const timestamp = Math.floor(date.getTime() / 1000);

      const baseVolume = Number(operator.Volume) / 365; // Average daily volume
      const randomMultiplier = 0.7 + Math.random() * 0.6;

      metrics.push({
        id: `${operator.id}_${timestamp}`,
        operator: {
          id: operator.id,
          address: operator.address,
        },
        timestamp: BigInt(timestamp),
        date: date.toISOString().split("T")[0],
        volume: BigInt(Math.floor(Number(baseVolume) * randomMultiplier)),
        settledAmount: BigInt(Math.floor(Number(baseVolume) * 0.8 * randomMultiplier)),
        commissionEarned: BigInt(Math.floor((Number(operator.totalCommission) / 365) * randomMultiplier)),
        railsCreated: BigInt(Math.floor(Math.random() * 20 + 5)),
        settlementsProcessed: BigInt(Math.floor(Math.random() * 50 + 10)),
        uniqueClients: BigInt(Math.floor(Math.random() * 30 + 10)),
        totalApprovals: BigInt(Math.floor(Number(operator.totalApprovals) * (0.9 + Math.random() * 0.2))),
      });
    }
  });

  return metrics;
};
