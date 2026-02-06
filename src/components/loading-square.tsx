import { useState, useEffect, useRef } from 'react';

interface LoadingSquareProps {
  shouldRender?: boolean;
}

const minTimeout = 5000; // 5 seconds
const maxTimeout = 15000; // 15 seconds

export function LoadingSquare({ shouldRender = true }: LoadingSquareProps) {
  const [isFaded, setIsFaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldRender) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Random timeout between minTimeout and maxTimeout with uniform distribution
    // Math.random() returns [0, 1), so this gives uniform distribution
    const getRandomTimeout = () => minTimeout + Math.random() * (maxTimeout - minTimeout);
    
    const scheduleFade = (fadeToBlack: boolean) => {
      const timeout = getRandomTimeout();
      timerRef.current = setTimeout(() => {
        setIsFaded(fadeToBlack);
        // Schedule the next fade (opposite direction)
        scheduleFade(!fadeToBlack);
      }, timeout);
    };
    
    // Start by fading to black
    scheduleFade(true);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shouldRender]);

  return (
    <div
      className={`transition-all duration-300 aspect-square ${
        !shouldRender
          ? 'bg-transparent'
          : isFaded
          ? 'bg-black'
          : 'bg-rose-600 dark:bg-rose-700'
      }`}
      style={{
        width: 'calc((100% - 41px) / 40)', // 40 blocks, 41 gaps (1px each)
      }}
    />
  );
}
