import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Unlock } from "lucide-react";
import { useGameState, useGameIndex } from "@/hooks/use-game-index";
import { useSudokuState } from "@/hooks/use-sudoku-state";
import { SudokuPuzzle } from "@/components/sudoku-puzzle";

function GameLink({ 
  to, 
  label, 
  gameId 
}: { 
  to: string; 
  label: string; 
  gameId: 'invisible-heart' | 'unwrapped-uv' | 'museum-guard';
}) {
  const { isWon } = useGameState(gameId);

  return (
    <Card className="p-6 space-y-4 flex flex-col items-center">
      <h3 className="text-xl font-semibold">{label}</h3>
      
      <Button asChild variant="default" className="w-full">
        <Link to={to}>Play</Link>
      </Button>

      <div className="pt-2 w-full flex flex-col items-center gap-2">
        {/* Just show the icon, not a button */}
        <div className={`${isWon ? 'text-green-500' : 'text-gray-400'}`}>
          {isWon ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </div>
      </div>
    </Card>
  );
}

export default function GameIndex() {
  const { indexPath } = useGameIndex();
  const { allGamesWon } = useSudokuState();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          The Arcade
        </h1>
        <p className="text-muted-foreground">
          {allGamesWon ? "All games completed! Solve the puzzle below." : "Complete games to unlock secrets."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GameLink 
          to={`${indexPath}/invisible-heart`}
          label="Invisible Heart"
          gameId="invisible-heart"
        />
        <GameLink 
          to={`${indexPath}/unwrapped-uv`}
          label="Unwrapped UV"
          gameId="unwrapped-uv"
        />
        <GameLink 
          to={`${indexPath}/museum-guard`}
          label="Museum Guard"
          gameId="museum-guard"
        />
      </div>

      {/* Show sudoku puzzle when all games are beaten */}
      {allGamesWon && (
        <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <SudokuPuzzle />
        </div>
      )}
    </div>
  );
}
