import React from "react";
import { motion } from "framer-motion";
import { Zap, Users, Coins, Activity, TrendingUp, DollarSign } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";
import { usePaymentsMetrics } from "../hooks/useMetrics";
import { formatFIL, formatCompactNumber } from "../utils/formatters";

export const HeroStats: React.FC = () => {
  const { data: paymentsMetric, isLoading, isError, error, refetch } = usePaymentsMetrics();

  if (isLoading) {
    return (
      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 rounded-3xl blur-3xl' />
        <div className='relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 mb-8'>
          <div className='flex items-center justify-center h-64'>
            <LoadingSpinner size='lg' text='Loading network metrics...' />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !paymentsMetric) {
    return (
      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 rounded-3xl blur-3xl' />
        <div className='relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 mb-8'>
          <ErrorBoundary
            error={error as Error}
            onRetry={refetch}
            title='Failed to load network metrics'
            description='Unable to fetch the latest network statistics.'
          />
        </div>
      </div>
    );
  }

  const totalFilFormatted = formatFIL(paymentsMetric.totalFilBurned);

  return (
    <div className='relative'>
      {/* Background Effects */}
      <div className='absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 rounded-3xl blur-3xl' />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className='relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 mb-8'
      >
        {/* Hero Header */}
        <div className='text-center mb-12'>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent text-sm font-semibold mb-4'
          >
            <Zap className='w-4 h-4' />
            FILECOIN PAYMENTS NETWORK
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='text-4xl md:text-6xl font-bold text-white mb-4'
          >
            <AnimatedCounter value={totalFilFormatted} delay={0.6} />
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className='text-xl text-gray-300 mb-2'
          >
            Total Value Burned
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className='text-gray-400'
          >
            Powering the decentralized economy with secure, efficient payments
          </motion.p>
        </div>

        {/* Key Metrics Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <MetricCard
            title='Total Rails'
            value={formatCompactNumber(paymentsMetric.totalRails)}
            subtitle='Payment channels created'
            change='+12.5%'
            changeType='positive'
            icon={Activity}
            gradient='from-purple-500 to-pink-600'
            delay={0.2}
          />

          <MetricCard
            title='Active Rails'
            value={formatCompactNumber(paymentsMetric.totalActiveRails)}
            subtitle='Currently processing payments'
            change='+8.3%'
            changeType='positive'
            icon={TrendingUp}
            gradient='from-blue-500 to-cyan-600'
            delay={0.3}
          />

          <MetricCard
            title='Total Operators'
            value={formatCompactNumber(paymentsMetric.totalOperators)}
            subtitle='Network validators'
            change='+15.7%'
            changeType='positive'
            icon={Users}
            gradient='from-teal-500 to-green-600'
            delay={0.4}
          />

          <MetricCard
            title='Total Accounts'
            value={formatCompactNumber(paymentsMetric.totalAccounts)}
            subtitle='Unique network participants'
            change='+23.1%'
            changeType='positive'
            icon={Coins}
            gradient='from-orange-500 to-red-600'
            delay={0.5}
          />
        </div>

        {/* Additional Stats Row */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
          <MetricCard
            title='Unique Payers'
            value={formatCompactNumber(paymentsMetric.uniquePayers)}
            subtitle='Active payment senders'
            icon={DollarSign}
            gradient='from-indigo-500 to-purple-600'
            delay={0.6}
          />

          <MetricCard
            title='Unique Payees'
            value={formatCompactNumber(paymentsMetric.uniquePayees)}
            subtitle='Payment recipients'
            icon={Users}
            gradient='from-cyan-500 to-blue-600'
            delay={0.7}
          />

          <MetricCard
            title='Finalized Rails'
            value={formatCompactNumber(paymentsMetric.totalFinalizedRails)}
            subtitle='Successfully completed'
            change='+5.2%'
            changeType='positive'
            icon={Activity}
            gradient='from-green-500 to-teal-600'
            delay={0.8}
          />
        </div>
      </motion.div>
    </div>
  );
};
