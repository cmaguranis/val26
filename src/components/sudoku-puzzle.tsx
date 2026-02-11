import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSudokuState } from '@/hooks/use-sudoku-state';
import { CheckCircle2 } from 'lucide-react';

export function SudokuPuzzle() {
  const navigate = useNavigate();
  const { userGrid, updateCell, isSolved, isCellFixed } = useSudokuState();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSolved && !showSuccess) {
      setShowSuccess(true);
    }
  }, [isSolved, showSuccess]);

  const handleCellChange = (row: number, col: number, value: string) => {
    if (isSolved) return;
    
    const num = parseInt(value);
    if (value === '' || value === '0') {
      updateCell(row, col, null);
    } else if (num >= 1 && num <= 3) {
      updateCell(row, col, num);
    }
  };

  const handleContinue = () => {
    navigate('/password-prompt');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Final Puzzle
        </h2>
        <p className="text-muted-foreground">
          Win each game to reveal numbers in the sudoku puzzle
        </p>
      </div>

      {/* Sudoku Grid */}
      <Card className={cn(
        "relative transition-all duration-500",
        isSolved && "border-2 border-green-500 bg-green-50 dark:bg-green-950/20"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg">
              {[0, 1, 2].map(row => (
                [0, 1, 2].map(col => {
                  const fixed = isCellFixed(row, col);
                  return (
                    <input
                      key={`${row}-${col}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={userGrid[row][col] ?? ''}
                      onChange={(e) => handleCellChange(row, col, e.target.value)}
                      disabled={isSolved || fixed}
                      className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 text-center text-2xl font-bold border-2 rounded-lg transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                        isSolved 
                          ? "bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300 cursor-not-allowed"
                          : fixed
                            ? "bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100 cursor-not-allowed"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-600"
                      )}
                    />
                  );
                })
              ))}
            </div>

            {/* Success message and continue button */}
            {showSuccess && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xl font-bold">Puzzle Solved!</span>
                </div>
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Continue
                </Button>
              </div>
            )}

            {!isSolved && (
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Fill in the remaining cells so each row and column contains 1, 2, and 3 exactly once.
                The colored cells are fixed based on your game results.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
