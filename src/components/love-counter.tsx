import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { content } from '@/config/content';

export function LoveCounter() {
  const [amount, setAmount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAnimating) return;
    
    // Don't restart animation if we've already reached the final target
    if (amount >= 9999) return;
    
    setIsAnimating(true);
    let currentAmount = 0;
    const pauseTarget = 5000;
    const finalTarget = 9999;
    const slowdownThreshold = 4990;
    let hasPaused = false;
    
    const animate = () => {
      if (currentAmount >= finalTarget) {
        setAmount(finalTarget);
        setIsAnimating(false);
        return;
      }

      // Check if we've reached 5000 and need to pause
      if (currentAmount >= pauseTarget && !hasPaused) {
        setAmount(pauseTarget);
        hasPaused = true;
        // Wait 1 second, then continue to 9999
        setTimeout(() => {
          animate();
        }, 1000);
        return;
      }

      let increment: number;
      let delay: number;

      if (currentAmount < slowdownThreshold) {
        // Fast initial animation
        const progress = currentAmount / slowdownThreshold;
        increment = Math.ceil(5 + progress * 150);
        delay = Math.max(5, 30 - (currentAmount / slowdownThreshold) * 25);
      } else if (currentAmount < pauseTarget) {
        // Slow down approaching 5000
        const remaining = pauseTarget - currentAmount;
        increment = Math.max(1, Math.ceil(remaining / 10));
        delay = 80;
      } else {
        // Rapid increase from 5000 to 9999
        const remaining = finalTarget - currentAmount;
        increment = Math.ceil(remaining / 20); // Large increments for rapid increase
        delay = 10; // Very short delay for rapid animation
      }

      currentAmount = Math.min(currentAmount + increment, finalTarget);
      setAmount(currentAmount);

      setTimeout(animate, delay);
    };

    setTimeout(animate, 500);
  }, [isAnimating]);

  const handleBack = () => {
    window.location.reload();
  };

  let formattedAmount = amount <= 9999 
    ? `$${amount.toString().padStart(4, '0')}` 
    : `$${amount}`;
  
  // Replace 9's with ∞ symbols when amount reaches 9999
  if (amount === 9999) {
    formattedAmount = formattedAmount.replace(/9/g, '∞');
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center space-y-12">
        {/* Title */}
        <div className="flex justify-center">
          <Badge variant="outline" className="!h-auto text-2xl md:text-4xl px-8 py-4 md:px-10 md:py-5 font-bold border-rose-600 dark:border-rose-400 text-rose-600 dark:text-rose-400">
            {content.counter.title}
          </Badge>
        </div>

        {/* Digital Counter */}
        <div className="relative inline-block">
          <div className="digital-counter-display">
            <div className="flex items-center justify-center">
              {formattedAmount.split('').map((char, index) => (
                <div
                  key={`${char}-${index}`}
                  className={`digital-digit ${char === '$' ? 'dollar-sign' : ''}`}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message - only show before continuing past 5000 */}
        <div className={`space-y-4 transition-opacity duration-500 ${amount >= 5000 && amount < 5100 ? 'opacity-100' : 'opacity-0 invisible'}`}>
          <p className="text-2xl md:text-3xl font-semibold text-rose-700 dark:text-rose-300">
            {content.counter.interstitialMessage}
          </p>
        </div>

        {/* Heart message - fade in when counter reaches 9999 */}
        <div className={`space-y-6 transition-opacity duration-1000 ${amount === 9999 ? 'opacity-100' : 'opacity-0 invisible'}`}>
          {/* Message */}
          <div className="space-y-6">
            <p className="text-xl md:text-2xl text-rose-600 dark:text-rose-400 max-w-2xl mx-auto">
              {content.heart.subtitle}
            </p>
            <p className="text-lg text-rose-600 dark:text-rose-400 max-w-2xl mx-auto">
              {content.heart.message}
            </p>
            <Button
              onClick={handleBack}
              size="lg"
              className="mt-8 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {content.heart.backButton}
            </Button>
          </div>
        </div>
      </div>

      {/* Digital counter styles */}
      <style>{`
        .digital-counter-display {
          display: inline-block;
          border: 1px solid #666666;
          border-radius: 4px;
        }

        .digital-digit {
          font-family: 'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
          font-weight: bold;
          font-size: 4rem;
          color: #FFFFFF;
          line-height: 1;
          min-width: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          background: #333333;
          border: 1px solid #666666;
          border-radius: 0;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          animation: digital-flicker 0.1s ease-in-out;
        }

        .digital-digit:not(:last-child) {
          border-right: none;
        }

        @keyframes digital-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }

        @media (min-width: 768px) {
          .digital-digit {
            font-size: 6rem;
            min-width: 4rem;
            padding: 1rem 1.25rem;
          }
        }

        @media (min-width: 1024px) {
          .digital-digit {
            font-size: 8rem;
            min-width: 5rem;
            padding: 1.25rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
