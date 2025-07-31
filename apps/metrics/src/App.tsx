import { motion } from "framer-motion";
import { HeroStats } from "./components/HeroStats";
import { OperatorLeaderboard } from "./components/OperatorLeaderboard";
import { TokenMetrics } from "./components/TokenMetrics";
import { TrendChart } from "./components/TrendChart";
import { TopOperatorCharts } from "./components/TopOperatorCharts";

function App() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent' />

      {/* Content */}
      <div className='relative'>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>F</span>
                </div>
                <div>
                  <h1 className='text-white font-bold text-lg'>Filecoin Payments</h1>
                  <p className='text-gray-400 text-xs'>Network Analytics Dashboard</p>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-green-400 text-sm font-medium'>Live</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='space-y-8'>
            {/* Hero Stats Section */}
            <HeroStats />

            {/* Top Performers Overview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='grid grid-cols-1 lg:grid-cols-2 gap-8'
            >
              <TokenMetrics />
              <OperatorLeaderboard />
            </motion.div>

            {/* Top Operator Analytics */}
            <TopOperatorCharts />

            {/* Network Activity Trends */}
            <TrendChart />

            {/* Network Health Section */}
            {/* <NetworkHealth /> */}
          </div>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className='border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm mt-16'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='text-center text-gray-400 text-sm'>
              <p>Powered by Filecoin Network • Real-time analytics • Built with ❤️</p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
