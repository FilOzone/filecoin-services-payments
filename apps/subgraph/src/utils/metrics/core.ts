import { Address, Bytes, BigInt as GraphBN } from "@graphprotocol/graph-ts";
import { DailyMetric, OperatorMetric, PaymentsMetric, TokenMetric, WeeklyMetric } from "../../../generated/schema";
import { DateHelpers, PAYMENTS_NETWORK_STATS_ID, ZERO_BIG_INT } from "./constants";

// Core metric entity creation and loading functions
export class MetricsEntityManager {
  static loadOrCreateDailyMetric(timestamp: GraphBN): DailyMetric {
    const dayStart = DateHelpers.getDayStartTimestamp(timestamp.toI64());
    const id = Bytes.fromI64(dayStart);

    let metric = DailyMetric.load(Bytes.fromByteArray(id));

    if (!metric) {
      metric = new DailyMetric(Bytes.fromByteArray(id));
      metric.timestamp = GraphBN.fromI64(dayStart);
      metric.date = DateHelpers.getDateString(dayStart);

      // Initialize all fields to zero
      metric.dailyFilBurned = ZERO_BIG_INT;
      metric.railsCreated = ZERO_BIG_INT;
      metric.railsSettled = ZERO_BIG_INT;
      metric.railsTerminated = ZERO_BIG_INT;
      metric.railsFinalized = ZERO_BIG_INT;
      metric.activeRailsCount = ZERO_BIG_INT;
      metric.uniquePayers = ZERO_BIG_INT;
      metric.uniquePayees = ZERO_BIG_INT;
      metric.uniqueOperators = ZERO_BIG_INT;
      metric.newAccounts = ZERO_BIG_INT;
      metric.cumulativeFilBurned = ZERO_BIG_INT;
      metric.cumulativeRails = ZERO_BIG_INT;
    }

    return metric;
  }

  static loadOrCreateWeeklyMetric(timestamp: GraphBN): WeeklyMetric {
    const weekStart = DateHelpers.getWeekStartTimestamp(timestamp.toI64());
    const id = Bytes.fromI64(weekStart);

    let metric = WeeklyMetric.load(Bytes.fromByteArray(id));

    if (!metric) {
      metric = new WeeklyMetric(Bytes.fromByteArray(id));
      metric.timestamp = GraphBN.fromI64(weekStart);
      metric.week = DateHelpers.getWeek(weekStart);

      metric.FilBurned = ZERO_BIG_INT;
      metric.railsCreated = ZERO_BIG_INT;
      metric.railsSettled = ZERO_BIG_INT;
      metric.settlementsCount = ZERO_BIG_INT;
      metric.rateChanges = ZERO_BIG_INT;
      metric.activeRailsCount = ZERO_BIG_INT;
      metric.uniqueActiveUsers = ZERO_BIG_INT;
    }

    return metric;
  }

  static loadOrCreateTokenMetric(tokenAddress: Address, timestamp: GraphBN): TokenMetric {
    const dayStart = DateHelpers.getDayStartTimestamp(timestamp.toI64());
    const id = tokenAddress.concat(Bytes.fromByteArray(Bytes.fromI64(dayStart)));

    let metric = TokenMetric.load(Bytes.fromByteArray(id));

    if (!metric) {
      metric = new TokenMetric(Bytes.fromByteArray(id));
      metric.token = tokenAddress;
      metric.timestamp = GraphBN.fromI64(dayStart);
      metric.date = DateHelpers.getDateString(dayStart);

      metric.dailyVolume = ZERO_BIG_INT;
      metric.dailyDeposit = ZERO_BIG_INT;
      metric.dailyWithdrawal = ZERO_BIG_INT;
      metric.dailySettledAmount = ZERO_BIG_INT;
      metric.dailyCommissionPaid = ZERO_BIG_INT;
      metric.activeRailsCount = ZERO_BIG_INT;
      metric.uniqueHolders = ZERO_BIG_INT;
      metric.totalLocked = ZERO_BIG_INT;
    }

    return metric;
  }

  static loadOrCreateOperatorMetric(operatorAddress: Address, timestamp: GraphBN): OperatorMetric {
    const dayStart = DateHelpers.getDayStartTimestamp(timestamp.toI64());
    const id = operatorAddress.concat(Bytes.fromByteArray(Bytes.fromI64(dayStart)));

    let metric = OperatorMetric.load(Bytes.fromByteArray(id));

    if (!metric) {
      metric = new OperatorMetric(Bytes.fromByteArray(id));
      metric.operator = operatorAddress;
      metric.timestamp = GraphBN.fromI64(dayStart);
      metric.date = DateHelpers.getDateString(dayStart);

      metric.dailyVolume = ZERO_BIG_INT;
      metric.dailySettledAmount = ZERO_BIG_INT;
      metric.dailyCommissionEarned = ZERO_BIG_INT;
      metric.railsCreated = ZERO_BIG_INT;
      metric.settlementsProcessed = ZERO_BIG_INT;
      metric.uniqueClients = ZERO_BIG_INT;
      metric.totalApprovals = ZERO_BIG_INT;
    }

    return metric;
  }

  static loadOrCreatePaymentsMetric(): PaymentsMetric {
    const id = Bytes.fromUTF8(PAYMENTS_NETWORK_STATS_ID);
    let metric = PaymentsMetric.load(Bytes.fromByteArray(id));

    if (!metric) {
      metric = new PaymentsMetric(Bytes.fromByteArray(id));
      metric.totalRails = ZERO_BIG_INT;
      metric.totalOperators = ZERO_BIG_INT;
      metric.totalTokens = ZERO_BIG_INT;
      metric.totalAccounts = ZERO_BIG_INT;
      metric.totalFilBurned = ZERO_BIG_INT;
      metric.totalActiveRails = ZERO_BIG_INT;
      metric.totalTerminatedRails = ZERO_BIG_INT;
      metric.totalFinalizedRails = ZERO_BIG_INT;
    }

    return metric;
  }
}

// Helper functions for common operations
export class MetricsHelpers {
  static updateCumulativeMetrics(dailyMetric: DailyMetric, previousDayMetric: DailyMetric | null): void {
    if (previousDayMetric) {
      dailyMetric.cumulativeFilBurned = previousDayMetric.cumulativeFilBurned.plus(dailyMetric.dailyFilBurned);
      dailyMetric.cumulativeRails = previousDayMetric.cumulativeRails.plus(dailyMetric.railsCreated);
    } else {
      // First day
      dailyMetric.cumulativeFilBurned = dailyMetric.dailyFilBurned;
      dailyMetric.cumulativeRails = dailyMetric.railsCreated;
    }
  }

  static calculateAverage(total: GraphBN, count: GraphBN): GraphBN {
    if (count.equals(ZERO_BIG_INT)) {
      return ZERO_BIG_INT;
    }
    return total.div(count);
  }

  static calculatePercentage(numerator: GraphBN, denominator: GraphBN): GraphBN {
    if (denominator.equals(ZERO_BIG_INT)) {
      return ZERO_BIG_INT;
    }
    return numerator.times(GraphBN.fromI32(10000)).div(denominator); // Return as basis points
  }
}
