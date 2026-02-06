import { useState, useEffect } from 'react';
import { LoadingSquare } from '@/components/loading-square';

export function LoadingBar() {
  // Number of blocks in the loading bar grid
  const totalBlocks = 40;
  const totalSquares = totalBlocks * 30;
  const [visibleSquares, setVisibleSquares] = useState(0);

  // Render a new square every 0.7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleSquares((prev) => {
        if (prev >= totalSquares) {
          return prev;
        }
        return prev + 1;
      });
    }, 700); // Every 0.7 seconds

    return () => clearInterval(interval);
  }, [totalSquares]);

  return (
    <div className="fixed inset-0 flex flex-row flex-wrap gap-1 p-1 pointer-events-none">
      {Array.from({ length: totalSquares }).map((_, index) => (
        <LoadingSquare key={index} shouldRender={index < visibleSquares} />
      ))}
    </div>
  );
}
