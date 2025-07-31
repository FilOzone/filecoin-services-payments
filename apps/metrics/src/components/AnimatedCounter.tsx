import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  delay?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2,
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const timer = setTimeout(() => {
      // Extract numeric part and suffix
      const numericMatch = value.match(/^([\d,.]+)/);
      const suffix = value.replace(/^[\d,.]+/, '');
      
      if (numericMatch) {
        const numericValue = parseFloat(numericMatch[1].replace(/,/g, ''));
        let startValue = 0;
        const increment = numericValue / (duration * 60); // 60fps
        
        const counter = setInterval(() => {
          startValue += increment;
          if (startValue >= numericValue) {
            setDisplayValue(value);
            clearInterval(counter);
          } else {
            const formattedValue = startValue.toLocaleString(undefined, {
              maximumFractionDigits: numericValue < 10 ? 2 : 0
            });
            setDisplayValue(formattedValue + suffix);
          }
        }, 1000 / 60);

        return () => clearInterval(counter);
      } else {
        setDisplayValue(value);
      }
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, duration, delay]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {displayValue}
    </motion.span>
  );
};