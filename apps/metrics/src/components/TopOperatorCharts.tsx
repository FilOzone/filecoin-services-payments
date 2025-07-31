import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, Activity, BarChart3, Crown } from "lucide-react";
import { useTopOperators, useOperatorMetrics } from "../hooks/useMetrics";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatFIL, formatDate, YAxisTickFormatter } from "../utils/formatters";

export const TopOperatorCharts: React.FC = () => {
  const { data: topOperators, isLoading: operatorsLoading } = useTopOperators();
  const { data: operatorMetrics, isLoading: metricsLoading, isError, error, refetch } = useOperatorMetrics();

  const isLoading = operatorsLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <div className='flex items-center justify-center h-96'>
          <LoadingSpinner text='Loading operator charts...' />
        </div>
      </div>
    );
  }

  if (isError || !topOperators || !operatorMetrics) {
    return (
      <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'>
        <ErrorBoundary
          error={error as Error}
          onRetry={refetch}
          title='Failed to load operator charts'
          description='Unable to fetch operator metrics data.'
        />
      </div>
    );
  }

  // Process chart data for top operators
  const chartData = operatorMetrics
    .filter((metric) => topOperators.some((op) => op.id === metric.operator.id))
    .reduce((acc: any[], metric) => {
      const dateKey = formatDate(metric.timestamp);

      let existingEntry = acc.find((entry) => entry.date === dateKey);
      if (!existingEntry) {
        existingEntry = { date: dateKey };
        acc.push(existingEntry);
      }

      const operatorIndex = topOperators.findIndex((op) => op.id === metric.operator.id);
      const operatorKey = `Operator ${operatorIndex + 1}`;

      existingEntry[`${operatorKey}_volume`] = Number(metric.volume);
      existingEntry[`${operatorKey}_commission`] = Number(metric.commissionEarned);
      existingEntry[`${operatorKey}_settlements`] = Number(metric.settlementsProcessed);

      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 periods

  const operatorColors = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-xl'>
          <p className='text-gray-300 text-sm mb-2'>{label}</p>
          {payload.map((entry: any, index: number) => {
            const [operator, metric] = entry.dataKey.split("_");
            const metricName = metric === "volume" ? "Volume" : metric === "commission" ? "Commission" : "Settlements";
            return (
              <div key={index} className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
                <span className='text-white text-sm'>
                  {operator} {metricName}:{" "}
                  {metric === "settlements" ? entry.value.toLocaleString() : formatFIL(BigInt(entry.value))}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6'
    >
      {/* Header with Toggle */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 bg-opacity-20'>
            <Crown className='w-5 h-5 text-purple-400' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>Top Operator Performance</h3>
            <p className='text-gray-400 text-sm'>Activity metrics for leading operators</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Volume Performance */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
            <Activity className='w-4 h-4 text-purple-400' />
            Volume Performance
          </h4>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
                <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, true)} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                {topOperators.slice(0, 4).map((operator, index) => (
                  <Line
                    key={operator.id}
                    type='monotone'
                    dataKey={`Operator ${index + 1}_volume`}
                    stroke={operatorColors[index]}
                    strokeWidth={2}
                    dot={{ fill: operatorColors[index], strokeWidth: 2, r: 4 }}
                    name={`Operator ${index + 1} Volume`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commission Earnings */}
        <div className='space-y-4'>
          <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
            <Users className='w-4 h-4 text-green-400' />
            Commission Earnings
          </h4>
          <div className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
                <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, true)} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                {topOperators.slice(0, 4).map((operator, index) => (
                  <Bar
                    key={operator.id}
                    dataKey={`Operator ${index + 1}_commission`}
                    fill={operatorColors[index]}
                    name={`Operator ${index + 1} Commission`}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Settlement Activity Chart */}
      <div className='mt-6 space-y-4'>
        <h4 className='text-lg font-semibold text-white flex items-center gap-2'>
          <BarChart3 className='w-4 h-4 text-blue-400' />
          Settlement Activity
        </h4>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis dataKey='date' stroke='#9CA3AF' fontSize={12} />
              <YAxis stroke='#9CA3AF' tickFormatter={(value) => YAxisTickFormatter(value, false)} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              {topOperators.slice(0, 4).map((operator, index) => (
                <Bar
                  key={operator.id}
                  dataKey={`Operator ${index + 1}_settlements`}
                  fill={operatorColors[index]}
                  name={`Operator ${index + 1} Settlements`}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operator Legend */}
      <div className='mt-6 flex flex-wrap gap-4 justify-center'>
        {topOperators.slice(0, 4).map((operator, index) => (
          <div key={operator.id} className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full' style={{ backgroundColor: operatorColors[index] }} />
            <span className='text-sm text-gray-300'>
              Operator {index + 1}
              {index === 0 && <Crown className='w-3 h-3 inline ml-1 text-yellow-400' />}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
