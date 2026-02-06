import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Loading bar progress - increment to fill one block at a time every 0.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        // Total blocks = 40 * 30 = 1200
        // Increment by 1/1200 (0.0833%) to fill exactly one block at a time
        const increment = 100 / 1200; // 100% / 1200 blocks = ~0.0833% per block
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          return increment; // Reset to one block filled
        }
        return newProgress;
      });
    }, 500); // Every 0.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Number of blocks in the loading bar grid
  const totalBlocks = 40;

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
      toMakeTransparent.forEach(pixelIdx => {
        data[pixelIdx + 3] = 0; // Set alpha to 0 (transparent)
      });

      ctx.putImageData(imageData, 0, 0);
      setProcessedDogImage(canvas.toDataURL('image/png'));
    };
    
    img.src = dogImage;
  }, [showDog, processedDogImage]);

  const getErrorMessage = () => {
    if (attempts === 1) return content.password.errorMessage1;
    if (attempts === 2) return content.password.errorMessage2;
    if (attempts >= 3) return content.password.errorMessage3;
    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password === landingConfig.password) {
      setAttempts(0);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts === 3) {
        setShowDog(true);
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
      <div className="fixed inset-0 flex flex-row flex-wrap gap-1 p-1 pointer-events-none">
        {Array.from({ length: totalBlocks * 30 }).map((_, index) => (
          <div
            key={index}
            className={`transition-all duration-300 aspect-square ${
              index < Math.floor((loadingProgress / 100) * totalBlocks * 30)
                ? 'bg-rose-600 dark:bg-rose-700'
                : 'bg-black'
            }`}
            style={{
              transitionDelay: `${(index % totalBlocks) * 5}ms`,
              width: 'calc((100% - 41px) / 40)', // 40 blocks, 41 gaps (1px each)
            }}
          />
        ))}
      </div>

      {/* Animated dog on third attempt */}
      {showDog && processedDogImage && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce-in dog-container">
          <button
            type="button"
            onClick={handleDogClick}
            className="cursor-pointer hover:scale-105 transition-transform"
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
      `}</style>
    </div>
  );
}
