import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingBar } from '@/components/loading-bar';
import { content } from '@/config/content';
import { landingConfig } from '@/config/landing-config';
import dogImage from '@/assets/dog.png';

interface PasswordPromptProps {
  onSuccess: () => void;
}

export function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showDog, setShowDog] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const [hintAccepted, setHintAccepted] = useState(false);
  const [processedDogImage, setProcessedDogImage] = useState<string | null>(null);
  const [shouldAnimateDog, setShouldAnimateDog] = useState(false);
  const [woofs, setWoofs] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const dogContainerRef = useRef<HTMLDivElement>(null);
  const woofIdCounter = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Hide dog button when attempts reset to 0
  useEffect(() => {
    if (attempts === 0) {
      // These state updates are intentional - resetting UI state based on attempts prop
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDog(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCallout(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHintAccepted(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldAnimateDog(false);
    }
  }, [attempts]);

  // Animate dog button after 4th attempt, then every 3 attempts (7, 10, 13, etc.)
  useEffect(() => {
    if (attempts >= 4 && (attempts - 4) % 3 === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldAnimateDog(true);
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setShouldAnimateDog(false);
      }, 1000); // Animation duration
      return () => clearTimeout(timer);
    } else {
      setShouldAnimateDog(false);
    }
  }, [attempts]);

  // Generate "woof" text around dog button
  useEffect(() => {
    if (!showDog) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWoofs([]);
      return;
    }

    const interval = setInterval(() => {
      // Generate random position around the dog button (within a radius)
      // Only top-left quadrant (above and to the left) - angles from π to 3π/2
      const angle = Math.PI + Math.random() * (Math.PI / 2);
      const distance = 60 + Math.random() * 80; // 60-140px from center
      const x = Math.cos(angle) * distance; // Negative (left)
      const y = Math.sin(angle) * distance; // Negative (above)

      const newWoof = {
        id: woofIdCounter.current++,
        x,
        y,
      };

      setWoofs((prev) => [...prev, newWoof]);

      // Remove woof after fade animation completes (1.5 seconds)
      setTimeout(() => {
        setWoofs((prev) => prev.filter((woof) => woof.id !== newWoof.id));
      }, 1500);
    }, 1350); // New woof interval

    return () => clearInterval(interval);
  }, [showDog]);

  // Process image to make white background transparent (only edge-connected white pixels)
  useEffect(() => {
    if (!showDog || processedDogImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Helper function to check if a pixel is white (or very close to white)
      const isWhite = (index: number) => {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        return r > 240 && g > 240 && b > 240;
      };

      // Helper function to get pixel index from x, y coordinates
      const getIndex = (x: number, y: number) => {
        return (y * width + x) * 4;
      };

      // Create a visited array to track which pixels we've processed
      const visited = new Array(width * height).fill(false);
      const toMakeTransparent = new Set<number>();

      // Flood fill function starting from edge white pixels
      const floodFill = (startX: number, startY: number) => {
        const stack: [number, number][] = [[startX, startY]];
        
        while (stack.length > 0) {
          const item = stack.pop();
          if (!item) break;
          const [x, y] = item;
          
          // Check bounds
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          
          const idx = y * width + x;
          if (visited[idx]) continue;
          
          const pixelIdx = getIndex(x, y);
          if (!isWhite(pixelIdx)) continue;
          
          visited[idx] = true;
          toMakeTransparent.add(pixelIdx);
          
          // Add neighbors to stack
          stack.push([x + 1, y]);
          stack.push([x - 1, y]);
          stack.push([x, y + 1]);
          stack.push([x, y - 1]);
        }
      };

      // Start flood fill from all edge pixels that are white
      // Top and bottom edges
      for (let x = 0; x < width; x++) {
        const topIdx = getIndex(x, 0);
        const bottomIdx = getIndex(x, height - 1);
        if (isWhite(topIdx) && !visited[x]) {
          floodFill(x, 0);
        }
        if (isWhite(bottomIdx) && !visited[(height - 1) * width + x]) {
          floodFill(x, height - 1);
        }
      }

      // Left and right edges
      for (let y = 0; y < height; y++) {
        const leftIdx = getIndex(0, y);
        const rightIdx = getIndex(width - 1, y);
        if (isWhite(leftIdx) && !visited[y * width]) {
          floodFill(0, y);
        }
        if (isWhite(rightIdx) && !visited[y * width + width - 1]) {
          floodFill(width - 1, y);
        }
      }

      // Make all edge-connected white pixels transparent
      for (const pixelIdx of toMakeTransparent) {
        data[pixelIdx + 3] = 0; // Set alpha to 0 (transparent)
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedDogImage(canvas.toDataURL('image/png'));
    };
    
    img.src = dogImage;
  }, [showDog, processedDogImage]);

  const getErrorMessage = () => {
    if (attempts === 1) return content.password.errorMessage1;
    if (attempts === 2) return content.password.errorMessage2;
    if (attempts === 3) return content.password.errorMessage3;
    if (attempts === 4) return content.password.errorMessage4;
    if (attempts === 5) return content.password.errorMessage5;
    if (attempts === 6) return content.password.errorMessage6;
    if (attempts === 7) return content.password.errorMessage7;
    if (attempts === 8) return content.password.errorMessage8;
    if (attempts === 9) return content.password.errorMessage9;
    if (attempts === 10) return content.password.errorMessage10;
    if (attempts === 11) return content.password.errorMessage11;
    if (attempts >= 12) return content.password.errorMessage12;
    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password === landingConfig.password) {
      setAttempts(0);
      setShowDog(false);
      setShowCallout(false);
      setHintAccepted(false);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      
      // Reset counter after the final prompt (attempt 12+)
      if (attempts >= 12) {
        setAttempts(0);
        setShowDog(false);
        setShowCallout(false);
        setHintAccepted(false);
        setShouldAnimateDog(false);
      } else {
        setAttempts(newAttempts);
        
        if (newAttempts === 3) {
          setShowDog(true);
        }
      }
      
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleDogClick = () => {
    setShowCallout(true);
  };

  const handleAccept = () => {
    setHintAccepted(true);
    // Keep callout open to show the hint message
  };

  const handleCancel = () => {
    setShowCallout(false);
    setShowDog(false);
    setAttempts(0);
    setHintAccepted(false);
  };

  // Close callout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calloutRef.current && !calloutRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the dog image
        const target = event.target as HTMLElement;
        if (!target.closest('.dog-container')) {
          setShowCallout(false);
        }
      }
    };

    if (showCallout) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCallout]);

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Full-page grid loading bar (behind everything) */}
      <LoadingBar />

      {/* Animated dog on third attempt */}
      {showDog && processedDogImage && (
        <div 
          ref={dogContainerRef}
          className={`fixed bottom-4 right-4 z-50 animate-bounce-in dog-container ${shouldAnimateDog ? 'dog-rock-animation' : ''}`}
        >
          {/* Woof text animations */}
          {woofs.map((woof) => (
            <div
              key={woof.id}
              className="absolute woof-text"
              style={{
                left: `calc(50% + ${woof.x}px)`,
                top: `calc(50% + ${woof.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              woof
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleDogClick}
            className="cursor-pointer hover:scale-105 transition-transform relative z-10"
            aria-label="Dog hint"
          >
            <img
              src={processedDogImage}
              alt="Dog"
              className="w-32 h-32 md:w-40 md:h-40 object-contain dog-image"
            />
          </button>
          
          {/* Callout */}
          {showCallout && (
            <div
              ref={calloutRef}
              className="absolute right-full top-0 mr-4 bg-card border-2 border-rose-200 dark:border-rose-800 shadow-lg p-4 rounded-lg animate-fade-in"
            >
              {!hintAccepted && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {content.password.hintQuestion}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="border-rose-200 dark:border-rose-800"
                    >
                      {content.password.cancelButton}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAccept}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {content.password.acceptButton}
                    </Button>
                  </div>
                </div>
              )}
              {hintAccepted && (
                <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                  I <em>am</em> the hint
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Card className="w-full max-w-md p-8 md:p-12 bg-card backdrop-blur-sm border-2 border-rose-200 dark:border-rose-800 relative z-10">
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400 bg-clip-text text-transparent">
            {content.password.title}
          </h2>
          
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder={content.password.placeholder}
                className="w-full px-4 py-3 text-lg border-2 border-rose-200 dark:border-rose-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
              />
              {attempts > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in">
                  {getErrorMessage()}
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6 bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl"
            >
              {content.password.submitButton}
            </Button>
          </form>
        </div>
      </Card>

      {/* Animation styles */}
      <style>{`
        @keyframes bounce-in {
          0% {
            transform: translateX(200%) translateY(200%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateX(0) translateY(0) scale(1.2);
            opacity: 1;
          }
          60% {
            transform: translateX(0) translateY(0) scale(0.9);
          }
          70% {
            transform: translateX(0) translateY(-20px) scale(1);
          }
          80% {
            transform: translateX(0) translateY(0) scale(1);
          }
          90% {
            transform: translateX(0) translateY(-10px) scale(1);
          }
          100% {
            transform: translateX(0) translateY(0) scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .dog-container {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }

        .dog-image {
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        @keyframes rock-back-forth {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(15deg);
          }
        }

        .dog-rock-animation {
          animation: rock-back-forth 0.5s ease-in-out 2;
        }

        .woof-text {
          font-family: 'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
          font-size: 1.25rem;
          font-weight: bold;
          color: #fda4af;
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          animation: woof-fade 1.5s ease-out forwards;
        }

        .dark .woof-text {
          color: #fda4af;
        }

        @keyframes woof-fade {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
