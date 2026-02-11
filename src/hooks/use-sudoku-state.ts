import { useState, useEffect } from 'react';
import { useGameState } from './use-game-index';

type GameId = 'invisible-heart' | 'unwrapped-uv' | 'museum-guard';

interface SudokuConstraint {
  gameId: GameId;
  row: number; // 0, 1, or 2
  col: number; // 0, 1, or 2
  digit: number; // 1, 2, or 3
}

interface SudokuConfig {
  constraints: SudokuConstraint[];
  solution: number[][];
}

// Generate a valid 3x3 sudoku solution
function generateValidSudoku(): number[][] {
  // All valid 3x3 sudoku grids (there are only 12 essentially different ones)
  const validGrids = [
    [[1, 2, 3], [2, 3, 1], [3, 1, 2]],
    [[1, 2, 3], [3, 1, 2], [2, 3, 1]],
    [[1, 3, 2], [2, 1, 3], [3, 2, 1]],
    [[1, 3, 2], [3, 2, 1], [2, 1, 3]],
    [[2, 1, 3], [1, 3, 2], [3, 2, 1]],
    [[2, 1, 3], [3, 2, 1], [1, 3, 2]],
    [[2, 3, 1], [1, 2, 3], [3, 1, 2]],
    [[2, 3, 1], [3, 1, 2], [1, 2, 3]],
    [[3, 1, 2], [1, 2, 3], [2, 3, 1]],
    [[3, 1, 2], [2, 3, 1], [1, 2, 3]],
    [[3, 2, 1], [1, 3, 2], [2, 1, 3]],
    [[3, 2, 1], [2, 1, 3], [1, 3, 2]],
  ];
  
  return validGrids[Math.floor(Math.random() * validGrids.length)];
}

// Generate sudoku configuration with random constraint assignment
function generateSudokuConfig(): SudokuConfig {
  const solution = generateValidSudoku();
  const gameIds: GameId[] = ['invisible-heart', 'unwrapped-uv', 'museum-guard'];
  
  // Each game reveals ONE cell in the 3x3 grid
  // Randomly assign each game to a unique cell position
  const usedPositions = new Set<string>();
  
  const constraints: SudokuConstraint[] = gameIds.map((gameId) => {
    let row: number;
    let col: number;
    
    // Find an unused cell
    do {
      row = Math.floor(Math.random() * 3);
      col = Math.floor(Math.random() * 3);
    } while (usedPositions.has(`${row},${col}`));
    
    usedPositions.add(`${row},${col}`);
    
    return {
      gameId,
      row,
      col,
      digit: solution[row][col]
    };
  });
  
  return { constraints, solution };
}

// Load or generate sudoku configuration
function loadSudokuConfig(): SudokuConfig {
  const stored = localStorage.getItem('sudoku_config');
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as SudokuConfig;
      
      // Validate that the config has the new format
      // Check if constraints have row, col, digit properties
      const isValidFormat = parsed.constraints?.every(c => 
        typeof c.row === 'number' && 
        typeof c.col === 'number' && 
        typeof c.digit === 'number'
      );
      
      if (isValidFormat) {
        return parsed;
      }
      
      // Old format detected, regenerate and clear solved status
      console.log('Old sudoku config format detected, regenerating...');
      localStorage.removeItem('sudoku_solved');
    } catch {
      // If parsing fails, generate new
    }
  }
  
  const config = generateSudokuConfig();
  localStorage.setItem('sudoku_config', JSON.stringify(config));
  return config;
}

export function useSudokuState() {
  const [config] = useState<SudokuConfig>(() => loadSudokuConfig());
  const [userGrid, setUserGrid] = useState<(number | null)[][]>(() => {
    // Initialize empty grid
    const initialGrid: (number | null)[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    
    return initialGrid;
  });
  const [isSolved, setIsSolved] = useState(false);
  
  // Check if all games are won
  const game1 = useGameState('invisible-heart');
  const game2 = useGameState('unwrapped-uv');
  const game3 = useGameState('museum-guard');
  
  const allGamesWon = game1.isWon && game2.isWon && game3.isWon;
  
  // Get constraint for a specific game
  const getConstraintForGame = (gameId: GameId) => {
    return config.constraints.find(c => c.gameId === gameId);
  };
  
  // Update the grid with revealed numbers when games are won
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserGrid(prevGrid => {
      const newGrid = prevGrid.map(r => [...r]);
      let hasChanges = false;
      
      config.constraints.forEach(constraint => {
        let isGameWon = false;
        if (constraint.gameId === 'invisible-heart') isGameWon = game1.isWon;
        if (constraint.gameId === 'unwrapped-uv') isGameWon = game2.isWon;
        if (constraint.gameId === 'museum-guard') isGameWon = game3.isWon;
        
        if (isGameWon && newGrid[constraint.row][constraint.col] === null) {
          newGrid[constraint.row][constraint.col] = constraint.digit;
          hasChanges = true;
        }
      });
      
      return hasChanges ? newGrid : prevGrid;
    });
  }, [game1.isWon, game2.isWon, game3.isWon, config.constraints]);
  
  // Validate if the current grid is correct
  const validateGrid = (grid: (number | null)[][]): boolean => {
    // Check if grid is complete
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i][j] === null) return false;
      }
    }
    
    // Check if it matches the solution
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i][j] !== config.solution[i][j]) return false;
      }
    }
    
    return true;
  };
  
  // Update a cell in the grid
  const updateCell = (row: number, col: number, value: number | null) => {
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = value;
    setUserGrid(newGrid);
    
    // Check if solved
    if (validateGrid(newGrid)) {
      setIsSolved(true);
      localStorage.setItem('sudoku_solved', 'true');
    }
  };
  
  // Check if sudoku was previously solved on mount
  useEffect(() => {
    const solved = localStorage.getItem('sudoku_solved');
    if (solved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSolved(true);
    }
  }, []);
  
  // Check if a cell is fixed by a constraint (revealed by winning a game)
  const isCellFixed = (row: number, col: number) => {
    return config.constraints.some(c => {
      if (c.row !== row || c.col !== col) return false;
      
      // Check if the game for this constraint has been won
      if (c.gameId === 'invisible-heart') return game1.isWon;
      if (c.gameId === 'unwrapped-uv') return game2.isWon;
      if (c.gameId === 'museum-guard') return game3.isWon;
      
      return false;
    });
  };

  return {
    config,
    userGrid,
    updateCell,
    isSolved,
    allGamesWon,
    getConstraintForGame,
    validateGrid,
    isCellFixed
  };
}
