import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: Date;
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onExpire, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  if (timeRemaining.isExpired) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        <span className="font-medium text-xs sm:text-sm">Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-orange-600" />
      <div className="flex space-x-1 text-xs font-mono">
        {timeRemaining.days > 0 && (
          <>
            <span className="bg-orange-100 text-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
              {timeRemaining.days}d
            </span>
          </>
        )}
        <span className="bg-orange-100 text-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
          {timeRemaining.hours.toString().padStart(2, '0')}h
        </span>
        <span className="bg-orange-100 text-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
          {timeRemaining.minutes.toString().padStart(2, '0')}m
        </span>
        <span className="bg-orange-100 text-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
          {timeRemaining.seconds.toString().padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;