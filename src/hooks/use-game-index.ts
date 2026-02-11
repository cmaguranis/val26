import { useState, useEffect, useCallback } from 'react';

// Hardcoded random 5-char string for now
export const GAME_INDEX_PATH = "/games";

export function useGameIndex() {
  return { indexPath: GAME_INDEX_PATH };
}

export function useGameState(gameId: string) {
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`game_won_${gameId}`);
    if (saved === 'true') {
      setIsWon(true);
    }
  }, [gameId]);

  const setWon = useCallback((won: boolean) => {
    setIsWon(won);
    localStorage.setItem(`game_won_${gameId}`, String(won));
  }, [gameId]);

  return { isWon, setWon };
}
