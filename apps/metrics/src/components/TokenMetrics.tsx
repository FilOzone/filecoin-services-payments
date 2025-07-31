import { motion } from "framer-motion";
import { Coins, Lock, TrendingUp, Users } from "lucide-react";
import React from "react";
import { useTopTokens, useTokenMetrics } from "../hooks/useMetrics";
import { formatFIL, formatToken } from "../utils/formatters";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadingSpinner } from "./LoadingSpinner";

export const TokenMetrics: React.FC = () => {
  const { data: topTokens, isLoading: tokensLoading } = useTopTokens();
  const { data: tokenMetrics, isLoading: metricsLoading, isError, error, refetch } = useTokenMetrics();

  const isLoading = tokensLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 bg-opacity-20'>
            <Coins className='w-5 h-5 text-blue-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Token Analytics</h3>
            <p className='text-gray-400 text-sm'>Multi-token ecosystem performance</p>
          </div>
        </div>
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner text='Loading token metrics...' />
        </div>
      </div>
    );
  }

  if (isError || !tokenMetrics) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 bg-opacity-20'>
            <Coins className='w-5 h-5 text-blue-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Token Analytics</h3>
            <p className='text-gray-400 text-sm'>Multi-token ecosystem performance</p>
          </div>
        </div>
        <ErrorBoundary
          error={error as Error}
          onRetry={refetch}
          title='Failed to load token metrics'
          description='Unable to fetch token analytics data.'
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 bg-opacity-20'>
            <Coins className='w-5 h-5 text-blue-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Token Analytics</h3>
            <p className='text-gray-400 text-sm'>Top 4 tokens by volume</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {topTokens &&
          topTokens.slice(0, 4).map((token, index) => {
            return (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className='relative group'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100' />

                <div className='relative bg-gray-900/30 border border-gray-700/30 rounded-xl p-5 hover:border-gray-600/50 transition-colors duration-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          token.symbol === "FIL"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : "bg-gradient-to-r from-green-500 to-teal-600 text-white"
                        }`}
                      >
                        {token.symbol}
                      </div>
                      <div>
                        <h4 className='text-white font-medium'>{token.name}</h4>
                        <p className='text-gray-400 text-sm'>{token.symbol}</p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <p className='text-white font-bold'>
                        {token.symbol === "FIL"
                          ? formatFIL(token.Volume)
                          : formatToken(token.Volume, token.decimals, token.symbol)}
                      </p>
                      <p className='text-gray-400 text-xs'>Daily Volume</p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-3'>
                      <div className='flex flex-wrap items-center justify-between'>
                        <div className='flex items-center gap-2 text-gray-400'>
                          <TrendingUp className='w-3 h-3' />
                          <span className='text-xs'>Total Volume</span>
                        </div>
                        <span className='text-white text-sm font-medium'>
                          {token.symbol === "FIL"
                            ? formatFIL(token.Volume)
                            : formatToken(token.Volume, token.decimals, token.symbol)}
                        </span>
                      </div>

                      <div className='flex flex-wrap items-center justify-between'>
                        <div className='flex items-center gap-2 text-gray-400'>
                          <Users className='w-3 h-3' />
                          <span className='text-xs'>User Funds</span>
                        </div>
                        <span className='text-white text-sm font-medium'>
                          {token.symbol === "FIL"
                            ? formatFIL(token.userFunds)
                            : formatToken(token.userFunds, token.decimals, token.symbol)}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='flex flex-wrap items-center justify-between'>
                        <div className='flex items-center gap-2 text-gray-400'>
                          <Lock className='w-3 h-3' />
                          <span className='text-xs'>Deposits</span>
                        </div>
                        <span className='text-white text-sm font-medium'>
                          {token.symbol === "FIL"
                            ? formatFIL(token.totalDeposits)
                            : formatToken(token.totalDeposits, token.decimals, token.symbol)}
                        </span>
                      </div>

                      <div className='flex flex-wrap items-center justify-between'>
                        <div className='flex items-center gap-2 text-gray-400'>
                          <Coins className='w-3 h-3' />
                          <span className='text-xs'>Settled</span>
                        </div>
                        <span className='text-white text-sm font-medium'>
                          {token.symbol === "FIL"
                            ? formatFIL(token.totalSettledAmount)
                            : formatToken(token.totalSettledAmount, token.decimals, token.symbol)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </motion.div>
  );
};
