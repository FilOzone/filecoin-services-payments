import { gql } from "graphql-request";

// Query for overall payments metrics
export const GET_PAYMENTS_METRICS = gql`
  query GetPaymentsMetrics {
    paymentsMetrics(first: 1) {
      id
      totalRails
      totalOperators
      totalTokens
      totalAccounts
      totalFilBurned
      totalZeroRateRails
      totalActiveRails
      totalTerminatedRails
      totalFinalizedRails
      uniquePayers
      uniquePayees
    }
  }
`;

// Query for daily metrics (last 30 days)
export const GET_DAILY_METRICS = gql`
  query GetDailyMetrics($first: Int = 30) {
    dailyMetrics(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      date
      filBurned
      railsCreated
      totalRailSettlements
      railsTerminated
      railsFinalized
      activeRailsCount
      uniquePayers
      uniquePayees
      uniqueOperators
      newAccounts
    }
  }
`;

// Query for weekly metrics (last 12 weeks)
export const GET_WEEKLY_METRICS = gql`
  query GetWeeklyMetrics($first: Int = 12) {
    weeklyMetrics(first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      week
      filBurned
      railsCreated
      totalRailSettlements
      railsTerminated
      railsFinalized
      activeRailsCount
      uniquePayers
      uniquePayees
      uniqueOperators
      newAccounts
    }
  }
`;

// Query for top tokens by volume
export const GET_TOP_TOKENS = gql`
  query GetTopTokens($first: Int = 4) {
    tokens(first: $first, orderBy: Volume, orderDirection: desc) {
      id
      name
      symbol
      decimals
      Volume
      totalDeposits
      totalWithdrawals
      totalSettledAmount
      userFunds
      operatorCommission
    }
  }
`;

// Query for daily token metrics for specific tokens
export const GET_DAILY_TOKEN_METRICS = gql`
  query GetDailyTokenMetrics($tokenIds: [Bytes!]!, $first: Int = 30) {
    dailyTokenMetrics(where: { token_in: $tokenIds }, first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      token {
        id
        name
        symbol
        decimals
      }
      timestamp
      date
      volume
      deposit
      withdrawal
      settledAmount
      commissionPaid
      activeRailsCount
      uniqueHolders
      totalLocked
    }
  }
`;

// Query for top operators by volume
export const GET_TOP_OPERATORS = gql`
  query GetTopOperators($first: Int = 4) {
    operators(first: $first, orderBy: Volume, orderDirection: desc) {
      id
      address
      totalRails
      totalCommission
      totalApprovals
      Volume
    }
  }
`;

// Query for daily operator metrics for specific operators
export const GET_DAILY_OPERATOR_METRICS = gql`
  query GetDailyOperatorMetrics($operatorIds: [Bytes!]!, $first: Int = 30) {
    dailyOperatorMetrics(
      where: { operator_in: $operatorIds }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      operator {
        id
        address
      }
      timestamp
      date
      volume
      settledAmount
      commissionEarned
      railsCreated
      settlementsProcessed
      uniqueClients
      totalApprovals
    }
  }
`;
