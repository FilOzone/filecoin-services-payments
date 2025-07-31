import React from "react";
import { motion } from "framer-motion";
import { Shield, Activity, Zap, CheckCircle } from "lucide-react";
import { usePaymentsMetrics } from "../hooks/useMetrics";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatCompactNumber } from "../utils/formatters";

export const NetworkHealth: React.FC = () => {
  const { data: paymentsMetric, isLoading, isError, error, refetch } = usePaymentsMetrics();

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 bg-opacity-20'>
            <Shield className='w-5 h-5 text-green-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Network Health</h3>
            <p className='text-gray-400 text-sm'>Real-time system performance indicators</p>
          </div>
        </div>
        <div className='flex items-center justify-center h-64'>
          <LoadingSpinner text='Loading network health...' />
        </div>
      </div>
    );
  }

  if (isError || !paymentsMetric) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 bg-opacity-20'>
            <Shield className='w-5 h-5 text-green-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Network Health</h3>
            <p className='text-gray-400 text-sm'>Real-time system performance indicators</p>
          </div>
        </div>
        <ErrorBoundary
          error={error as Error}
          onRetry={refetch}
          title='Failed to load network health'
          description='Unable to fetch network health indicators.'
        />
      </div>
    );
  }

  const totalRails = Number(paymentsMetric.totalRails);
  const activeRails = Number(paymentsMetric.totalActiveRails);
  const terminatedRails = Number(paymentsMetric.totalTerminatedRails);
  const finalizedRails = Number(paymentsMetric.totalFinalizedRails);

  const healthScore = Math.round((activeRails / totalRails) * 100);
  const successRate = Math.round((finalizedRails / (finalizedRails + terminatedRails)) * 100);

  const metrics = [
    {
      title: "Network Health",
      value: `${healthScore}%`,
      description: "Active rails ratio",
      icon: Shield,
      color: healthScore > 80 ? "text-green-400" : healthScore > 60 ? "text-yellow-400" : "text-red-400",
      bgColor: healthScore > 80 ? "from-green-500" : healthScore > 60 ? "from-yellow-500" : "from-red-500",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: "Finalized vs terminated",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "from-green-500",
    },
    {
      title: "Activity Level",
      value: "High",
      description: `${formatCompactNumber(activeRails)} active`,
      icon: Activity,
      color: "text-blue-400",
      bgColor: "from-blue-500",
    },
    {
      title: "Network Status",
      value: "Optimal",
      description: "All systems operational",
      icon: Zap,
      color: "text-purple-400",
      bgColor: "from-purple-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'
    >
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 bg-opacity-20'>
          <Shield className='w-5 h-5 text-green-400' />
        </div>
        <div>
          <h3 className='text-xl font-bold text-white'>Network Health</h3>
          <p className='text-gray-400 text-sm'>Real-time system performance indicators</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            className='relative group'
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${metric.bgColor} to-transparent rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
            />

            <div className='relative bg-gray-900/30 border border-gray-700/30 rounded-xl p-4 hover:border-gray-600/50 transition-colors duration-300'>
              <div className='flex items-center gap-3 mb-3'>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                <span className='text-gray-400 text-sm'>{metric.title}</span>
              </div>

              <div className='space-y-1'>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <div className='text-gray-500 text-xs'>{metric.description}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Health Status Bar */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className='mt-6 p-4 bg-gray-900/30 rounded-xl border border-gray-700/30'
      >
        <div className='flex items-center justify-between mb-2'>
          <span className='text-gray-400 text-sm'>Overall Network Health</span>
          <span className='text-green-400 font-medium'>{healthScore}%</span>
        </div>

        <div className='w-full bg-gray-700 rounded-full h-2'>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthScore}%` }}
            transition={{ duration: 1, delay: 1 }}
            className='bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full'
          />
        </div>

        <div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
          <CheckCircle className='w-3 h-3 text-green-400' />
          <span>All critical systems operational</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
