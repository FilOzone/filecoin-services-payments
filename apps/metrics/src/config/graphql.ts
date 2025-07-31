// GraphQL endpoint configuration
export const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8000/subgraphs/name/filecoin-payments';

// For now, we'll use a mock endpoint that returns our mock data
// When your subgraph is ready, just update the GRAPHQL_ENDPOINT above
export const USE_MOCK_DATA = true;