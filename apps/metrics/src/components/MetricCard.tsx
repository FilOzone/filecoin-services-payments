import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'from-purple-500 to-blue-600',
  delay = 0
}) => {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  }[changeType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
      
      <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div className={`text-sm font-medium ${changeColor}`}>
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.2 }}
            className="text-2xl font-bold text-white"
          >
            {value}
          </motion.div>
          {subtitle && (
            <p className="text-gray-500 text-xs">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};