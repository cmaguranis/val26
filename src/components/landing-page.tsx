import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingBar } from '@/components/loading-bar';
import { landingConfig } from '@/config/landing-config';
import { content } from '@/config/content';

export function LandingPage() {
  const targetDate = useMemo(() => {
    // Manually parse to ensure it uses the user's local timezone explicitly
    try {
      const [datePart, timePart] = landingConfig.targetDate.split('T');
      if (!datePart || !timePart) return new Date(landingConfig.targetDate);
      
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      
      // Date constructor with multiple arguments uses local time
      // Month is 0-indexed (0 = January)
      return new Date(year, month - 1, day, hour, minute, second);
    } catch (e) {
      console.error("Error parsing date, falling back to string parse", e);
      return new Date(landingConfig.targetDate);
    }
  }, []);
  const [isDateReached, setIsDateReached] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDevTools, setShowDevTools] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isButtonEvading, setIsButtonEvading] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);
  const flipClockInstance = useRef<(() => void) | null>(null);
  const navigate = useNavigate();

  // Track if URL params are being used to override state
  const urlOverrideRef = useRef(false);

  // Handle URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');

    if (view === 'countdown' || params.has('landing-countdown')) {
      setIsDateReached(false);
      urlOverrideRef.current = true;
    } else if (view === 'ready' || params.has('landing-ready')) {
      setIsDateReached(true);
      urlOverrideRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Check if target date has been reached (only if not overridden by URL params)
    const checkDate = () => {
      const now = new Date();
      setCurrentTime(now);
      // Don't override if URL params are set
      if (urlOverrideRef.current) return;
      const reached = now >= targetDate;
      if (reached !== isDateReached) {
        setIsDateReached(reached);
      }
    };

    checkDate();
    const interval = setInterval(checkDate, 1000);

    // Check for dev mode (press 'd' key 3 times quickly)
    let dKeyPressCount = 0;
    let dKeyTimeout: ReturnType<typeof setTimeout>;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        dKeyPressCount++;
        clearTimeout(dKeyTimeout);
        
        if (dKeyPressCount === 3) {
          setShowDevTools(prev => !prev);
          dKeyPressCount = 0;
        }
        
        dKeyTimeout = setTimeout(() => {
          dKeyPressCount = 0;
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(dKeyTimeout);
    };
  }, [targetDate, isDateReached]);


  // Separate useEffect for FlipClock initialization
  useEffect(() => {
    if (isDateReached) return;
    
    // Wait for DOM to be ready
    const initClock = () => {
      if (!clockRef.current) {
        setTimeout(initClock, 100);
        return;
      }
      
      // Prevent double initialization - check if clock already exists
      if (flipClockInstance.current || clockRef.current.children.length > 0) {
        return;
      }

      import('flipclock').then((module) => {
        // Double-check that we haven't already initialized
        if (flipClockInstance.current || !clockRef.current || clockRef.current.children.length > 0) {
          return;
        }
        
        // Try to get the exports - flipclock v1.0.1 might export differently
        const flipClockModule = module as Record<string, unknown>;
        const flipClock = flipClockModule.flipClock || (flipClockModule.default as Record<string, unknown>)?.flipClock || flipClockModule.default;
        const elapsedTime = flipClockModule.elapsedTime || (flipClockModule as Record<string, unknown>).elapsedTime;
        const theme = flipClockModule.theme || (flipClockModule as Record<string, unknown>).theme;
        const css = flipClockModule.css || (flipClockModule as Record<string, unknown>).css;

        if (!flipClock || !elapsedTime) {
          return;
        }

        try {
          const instance = (flipClock as (config: unknown) => [unknown, () => void])({
            parent: clockRef.current as Element,
            face: (elapsedTime as (config: unknown) => unknown)({
              to: targetDate,
              format: '[DD]:[hh]:[mm]:[ss]'
            }),
            theme: (theme as (config: unknown) => unknown)({
              dividers: ':',
              labels: [['DAYS'], ['HOURS'], ['MINUTES'], ['SECONDS']],
              css: (css as (config: unknown) => unknown)({
                fontSize: '2rem',
                borderRadius: '8px',
              })
            })
          });

          // Hook into the face's onStop event
          if (instance && Array.isArray(instance) && instance[0]) {
            const faceObj = instance[0] as { onStop?: () => void };
            if (faceObj.onStop) {
              faceObj.onStop = () => {
                setIsDateReached(true);
              };
            }
          }

          flipClockInstance.current = instance[1]; // Store cleanup function
        } catch {
          // Silently fail if flipclock initialization fails
        }
      }).catch(() => {
        // Silently fail if flipclock package fails to load
      });
    };

    initClock();

    return () => {
      // Clean up FlipClock instance
      const currentClockEl = clockRef.current;
      if (flipClockInstance.current) {
        // Call the cleanup function
        flipClockInstance.current();
        flipClockInstance.current = null;
      }
      // Clear the DOM element
      if (currentClockEl) {
        currentClockEl.innerHTML = '';
      }
    };
  }, [isDateReached, targetDate]); // Include dependencies

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDateReached || !buttonRef.current || isButtonEvading) return;

    const button = buttonRef.current;
    const buttonRect = button.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate distance from mouse to button center
    const distanceX = mouseX - buttonCenterX;
    const distanceY = mouseY - buttonCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If mouse is within 150px of button, move button away
    const threshold = 150;
    if (distance < threshold) {
      setIsButtonEvading(true);

      // Calculate escape direction (away from mouse)
      const angle = Math.atan2(distanceY, distanceX);
      const escapeDistance = 200;
      
      const newX = -Math.cos(angle) * escapeDistance;
      const newY = -Math.sin(angle) * escapeDistance;

      // Ensure button stays within viewport
      const maxX = window.innerWidth - buttonRect.width - 100;
      const maxY = window.innerHeight - buttonRect.height - 100;
      
      const clampedX = Math.max(-buttonRect.left + 50, Math.min(newX, maxX - buttonRect.left));
      const clampedY = Math.max(-buttonRect.top + 50, Math.min(newY, maxY - buttonRect.top));

      setButtonPosition({ x: clampedX, y: clampedY });

      // Reset after animation
      setTimeout(() => setIsButtonEvading(false), 500);
    }
  };

  const handleCTAClick = () => {
    navigate('/games');
  };

  const timeUntilTarget = targetDate.getTime() - currentTime.getTime();
  const daysRemaining = Math.ceil(timeUntilTarget / (1000 * 60 * 60 * 24));

  return (
    <div 
      className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative"
      onMouseMove={handleMouseMove}
    >
      {/* Full-page grid loading bar (behind everything) */}
      <LoadingBar />

      {/* Dev Tools Overlay */}
      {showDevTools && (
        <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg space-y-2 text-xs font-mono max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">{content.dev.title}</span>
            <button 
              type="button"
              onClick={() => setShowDevTools(false)}
              className="text-neutral-400 hover:text-white"
            >
              {content.dev.closeButton}
            </button>
          </div>
          <div>{content.dev.targetDateLabel} {targetDate.toISOString()}</div>
          <div>{content.dev.currentTimeLabel} {currentTime.toISOString()}</div>
          <div>{content.dev.daysRemainingLabel} {daysRemaining}</div>
          <div>{content.dev.buttonEnabledLabel} {isDateReached ? content.dev.yes : content.dev.no}</div>
          <div className="text-neutral-400 text-[10px] mt-2">
            {content.dev.toggleHint}
          </div>
        </div>
      )}

      <Card className="w-full max-w-4xl p-8 md:p-12 bg-card backdrop-blur-sm border-2 border-rose-200 dark:border-rose-800 relative z-10">
        <div className="flex flex-col items-center space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400 bg-clip-text text-transparent">
              {landingConfig.content.title}
            </h1>
          </div>

          {/* Status Badge */}
          {isDateReached && (
            <Badge variant="outline" className="text-sm px-4 py-2 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700">
              ✔ {content.landing.successBadge}
            </Badge>
          )}

          {/* Flip Clock Countdown */}
          <div className="w-full flex justify-center py-8">
            {!isDateReached ? (
              <div ref={clockRef} className="flip-clock-wrapper" />
            ) : (
              <div className="text-center space-y-2">
                <div className="pixel-block">
                  <div className="pixelized--heart"></div>
                </div>
                <p className="text-2xl font-semibold text-rose-700 dark:text-rose-300 mt-8">
                  {content.landing.successMessage}
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="w-full max-w-md relative">
            <Button
              ref={buttonRef}
              size="lg"
              className="w-full text-lg py-6 transition-all duration-500 ease-out bg-rose-600 hover:bg-rose-700 disabled:bg-gray-500 disabled:hover:bg-gray-500 text-white shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              disabled={!isDateReached}
              onClick={handleCTAClick}
              style={{
                transform: isDateReached ? `translate(${buttonPosition.x}px, ${buttonPosition.y}px)` : 'none',
              }}
            >
              {isDateReached ? (
                <span className="flex items-center justify-center gap-2">
                  <span>{landingConfig.content.ctaTextEnabled}</span>
                </span>
              ) : (
                <span>{landingConfig.content.ctaTextDisabled}</span>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Custom styles for flip clock and pixelated heart */}
      <style>{`
        .flip-clock-wrapper {
          display: flex;
          justify-content: center;
        }

        .flip-clock {
          --fcc-digit-color: #ffffff;
          --fcc-background: #be123c;
        }

        .flip-clock-card .top,
        .flip-clock-card .bottom,
        .flip-clock-card-item-inner .top,
        .flip-clock-card-item-inner .bottom {
          background: #be123c !important;
        }

        .flip-clock-label {
          font-size: 0.625rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          color: #71717a !important;
          margin-top: 0.5rem !important;
        }

        .flip-clock-divider {
          color: #71717a !important;
        }

        .pixel-block {
          position: relative;
          display: inline-block;
          width: 6em;
          height: 5em;
          margin: 0 auto;
        }

        .pixelized--heart {
          display: block;
          width: 1em;
          height: 1em;
          
          box-shadow:
            1em 0em #ff0040,
            2em 0em #ff0040,
            4em 0em #ff0040,
            5em 0em #ff0040,
            0em 1em #ff0040,
            1em 1em #ff0040,
            2em 1em #ff0040,
            3em 1em #ff0040,
            4em 1em #ff0040,
            5em 1em #ff0040,
            6em 1em #ff0040,
            0em 2em #ff0040,
            1em 2em #ff0040,
            2em 2em #ff0040,
            3em 2em #ff0040,
            4em 2em #ff0040,
            5em 2em #ff0040,
            6em 2em #ff0040,
            1em 3em #ff0040,
            2em 3em #ff0040,
            3em 3em #ff0040,
            4em 3em #ff0040,
            5em 3em #ff0040,
            2em 4em #ff0040,
            3em 4em #ff0040,
            4em 4em #ff0040,
            3em 5em #ff0040;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }

        @media (min-width: 768px) {
          .flip-clock {
            font-size: 3rem !important;
          }

          .pixel-block {
            width: 8em;
            height: 6.67em;
          }
        }

        @media (min-width: 1024px) {
          .pixel-block {
            width: 10em;
            height: 8.33em;
          }
        }
      `}</style>
    </div>
  );
}