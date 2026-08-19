import React, { useEffect } from 'react';
import { RoverLogo } from './RoverLogo';

interface PageLoaderProps {
  minDurationMs?: number;
  isReady?: boolean;
  onComplete?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  minDurationMs = 2000,
  isReady = true,
  onComplete,
}) => {
  useEffect(() => {
    const startTime = Date.now();
    const checkInterval = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= minDurationMs && isReady) {
        clearInterval(timer);
        if (onComplete) {
          onComplete();
        }
      }
    }, checkInterval);

    return () => clearInterval(timer);
  }, [minDurationMs, isReady, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col items-center justify-center gap-3 select-none">
      <RoverLogo className="w-16 h-16 animate-pulse" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Arabiyya Rovers
      </span>
    </div>
  );
};
