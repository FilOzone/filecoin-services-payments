import { motion } from "framer-motion";
import { Activity, Crown, TrendingUp, Users } from "lucide-react";
import React from "react";
import { useTopOperators, useOperatorMetrics } from "../hooks/useMetrics";
import { formatAddress, formatFIL, formatCompactNumber } from "../utils/formatters";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadingSpinner } from "./LoadingSpinner";

export const OperatorLeaderboard: React.FC = () => {
  const { data: topOperators, isLoading: operatorsLoading } = useTopOperators();
  const { data: operatorMetrics, isLoading: metricsLoading, isError, error, refetch } = useOperatorMetrics();

  const isLoading = operatorsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 bg-opacity-20'>
            <Crown className='w-5 h-5 text-yellow-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Top Operators</h3>
            <p className='text-gray-400 text-sm'>Leading network validators by volume</p>
          </div>
        </div>
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner text='Loading operators...' />
        </div>
      </div>
    );
  }

  if (isError || !operatorMetrics) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 bg-opacity-20'>
            <Crown className='w-5 h-5 text-yellow-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Top Operators</h3>
            <p className='text-gray-400 text-sm'>Leading network validators by volume</p>
          </div>
        </div>
        <ErrorBoundary
          error={error as Error}
          onRetry={refetch}
          title='Failed to load operators'
          description='Unable to fetch operator leaderboard data.'
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'
    >
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 bg-opacity-20'>
            <Crown className='w-5 h-5 text-yellow-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Top Operators</h3>
            <p className='text-gray-400 text-sm'>Top 4 operators by volume</p>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        {topOperators &&
          topOperators.slice(0, 4).map((operator, index) => {
            // Get the latest metrics for this operator
            const latestMetrics = operatorMetrics?.filter((m) => m.operator.id === operator.id)?.[0];

            return (
              <motion.div
                key={operator.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className='relative group'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                <div className='relative flex items-center justify-between p-4 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-colors duration-300'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-gray-900"
                            : index === 1
                            ? "bg-gray-400 text-gray-900"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index === 0 && <Crown className='w-4 h-4 text-yellow-400' />}
                    </div>

                    <div>
                      <h4 className='text-white font-medium'>Operator #{index + 1}</h4>
                      <p className='text-gray-400 text-sm'>{formatAddress(operator.address)}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-6 text-right'>
                    <div>
                      <p className='text-white font-medium'>{formatFIL(latestMetrics?.volume || operator.Volume)}</p>
                      <p className='text-gray-400 text-xs'>Daily Volume</p>
                    </div>

                    <div className='flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-1 text-green-400'>
                        <Activity className='w-3 h-3' />
                        <span>{formatCompactNumber(operator.totalRails)}</span>
                      </div>
                      <div className='flex items-center gap-1 text-blue-400'>
                        <Users className='w-3 h-3' />
                        <span>{formatCompactNumber(operator.totalApprovals)}</span>
                      </div>
                      <div className='flex items-center gap-1 text-purple-400'>
                        <TrendingUp className='w-3 h-3' />
                        <span>{formatFIL(latestMetrics?.commissionEarned || operator.totalCommission)}</span>
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
