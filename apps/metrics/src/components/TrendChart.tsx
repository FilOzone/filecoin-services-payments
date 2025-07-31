import React, { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Activity, Flame, Calendar, BarChart3, Zap } from "lucide-react";
import { useDailyMetrics, useWeeklyMetrics } from "../hooks/useMetrics";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatDate, formatToken, YAxisTickFormatter } from "../utils/formatters";

export const TrendChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("daily");
  const {
    data: dailyMetrics,
    isLoading: dailyLoading,
    isError: dailyError,
    error: dailyErrorMsg,
    refetch: refetchDaily,
  } = useDailyMetrics(14);
  const {
    data: weeklyMetrics,
    isLoading: weeklyLoading,
    isError: weeklyError,
    error: weeklyErrorMsg,
    refetch: refetchWeekly,
  } = useWeeklyMetrics(8);

  const isLoading = timeframe === "daily" ? dailyLoading : weeklyLoading;
  const isError = timeframe === "daily" ? dailyError : weeklyError;
  const error = timeframe === "daily" ? dailyErrorMsg : weeklyErrorMsg;
  const refetch = timeframe === "daily" ? refetchDaily : refetchWeekly;
  const metrics = timeframe === "daily" ? dailyMetrics : weeklyMetrics;

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center justify-center h-96'>
          <LoadingSpinner text='Loading network trends...' />
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <ErrorBoundary
          error={error as Error}
          onRetry={refetch}
          title='Failed to load network trends'
          description={`Unable to fetch ${timeframe} metrics for the charts.`}
        />
      </div>
    );
  }

  const chartData = metrics
    .map((metric) => {
      const isDaily = timeframe === "daily";
      return {
        date: isDaily ? formatDate(metric.timestamp) : `Week ${(metric as any).week}`,
        filBurned: Number(metric.filBurned),
        railsCreated: Number(metric.railsCreated || 0),
        activeRails: Number(metric.activeRailsCount || 0),
        settlements: Number(metric.totalRailSettlements || 0),
        finalized: Number(metric.railsFinalized || 0),
        terminated: Number(metric.railsTerminated || 0),
        uniqueUsers: Number(metric.uniquePayers || 0) + Number(metric.uniquePayees || 0),
      };
    })
    .reverse(); // Reverse to show chronological order

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-xl'>
          <p className='text-gray-300 text-sm mb-2'>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className='flex items-center gap-2'>
              <div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
              <span className='text-white text-sm'>
                {entry.name}:{" "}
                {entry.name === "FIL Burned"
                  ? formatToken(BigInt(entry.value), 18, "FIL")
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'
    >
      {/* Header with Toggle */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 bg-opacity-20'>
            <Activity className='w-5 h-5 text-orange-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Network Activity Trends</h3>
            <p className='text-gray-400 text-sm'>Overall network performance metrics</p>
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className='flex items-center gap-2 bg-gray-900/50 rounded-lg p-1'>
          <button
            onClick={() => setTimeframe("daily")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              timeframe === "daily"
                ? "bg-orange-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <Calendar className='w-4 h-4' />
            Daily
          </button>
          <button
            onClick={() => setTimeframe("weekly")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              timeframe === "weekly"
                ? "bg-orange-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <BarChart3 className='w-4 h-4' />
            Weekly
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* FIL Burned Trend */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
            <Flame className='w-4 h-4 text-orange-400' />
            FIL Burned
          </h4>

          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id='filGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#F59E0B' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#F59E0B' stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
                <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, true)} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type='monotone'
                  dataKey='filBurned'
                  stroke='#F59E0B'
                  strokeWidth={2}
                  fill='url(#filGradient)'
                  name='FIL Burned'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rail Settlements */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
            <Zap className='w-4 h-4 text-blue-400' />
            Rail Settlements
          </h4>

          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id='volumeGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3B82F6' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#3B82F6' stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
                <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, false)} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type='monotone'
                  dataKey='settlements'
                  stroke='#3B82F6'
                  strokeWidth={2}
                  fill='url(#volumeGradient)'
                  name='Rail Settlements'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rails Activity Chart */}
      <div className='mt-6 space-y-4'>
        <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
          <Activity className='w-4 h-4 text-green-400' />
          Rails Lifecycle
        </h4>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
              <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, false)} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type='monotone'
                dataKey='railsCreated'
                stroke='#10B981'
                strokeWidth={2}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                name='Rails Created'
              />
              <Line
                type='monotone'
                dataKey='finalized'
                stroke='#3B82F6'
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                name='Rails Finalized'
              />
              <Line
                type='monotone'
                dataKey='terminated'
                stroke='#EF4444'
                strokeWidth={2}
                dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                name='Rails Terminated'
              />
              <Line
                type='monotone'
                dataKey='activeRails'
                stroke='#F59E0B'
                strokeWidth={2}
                dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                name='Active Rails'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
