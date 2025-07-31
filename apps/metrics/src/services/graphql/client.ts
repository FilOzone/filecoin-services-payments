import { GraphQLClient } from "graphql-request";
import { GRAPHQL_ENDPOINT, USE_MOCK_DATA } from "../../config/graphql";
import { paymentsMetric, dailyMetrics, weeklyMetrics } from "../../data/mockData";

// Create GraphQL client
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT);

// Mock GraphQL responses that match the exact schema structure
const mockResponses: Record<string, any> = {
  GetPaymentsMetrics: {
    paymentsMetrics: [paymentsMetric],
  },
  GetDailyMetrics: {
    dailyMetrics: dailyMetrics,
  },
  GetWeeklyMetrics: {
    weeklyMetrics: weeklyMetrics,
  },
};

// Enhanced client that can switch between mock and real data
export const executeQuery = async (query: string, variables?: any, operationName?: string): Promise<any> => {
  if (USE_MOCK_DATA) {
    // Extract operation name from query if not provided
    const opName = operationName || query.match(/query\s+(\w+)/)?.[1];

    if (opName && mockResponses[opName]) {
      // Simulate network delay for realistic experience
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));
      return mockResponses[opName];
    }

    throw new Error(`Mock response not found for operation: ${opName}`);
  }

  // Use real GraphQL endpoint when USE_MOCK_DATA is false
  return graphqlClient.request(query, variables);
};
