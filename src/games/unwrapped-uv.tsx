import { useState, useEffect } from "react";
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameState } from "@/hooks/use-game-index";
import { UVCanvas } from "@/components/game/uv-canvas";
import { ModelViewer } from "@/components/game/model-viewer";

const ROUNDS_TOTAL = 5;

type ShapeType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';
const SHAPES: ShapeType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

const SHAPE_COLORS: Record<ShapeType, string> = {
  I: '#a8e6e6', // Pastel Cyan
  O: '#ffeb99', // Pastel Yellow
  T: '#d4a5d4', // Pastel Purple
  L: '#ffb366', // Pastel Orange
  J: '#a8c5e6', // Pastel Blue
  S: '#b8e6b8', // Pastel Green
  Z: '#ffb8b8'  // Pastel Red
};

// Helper to create a geometry that only contains UV data for the canvas
const createNetGeometry = (uvs: number[]): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(uvs.length / 2 * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  return geometry;
};

// 3D Geometry Helper
const createBlockGeometry = (blocks: [number, number, number][]) => {
  const baseGeo = new THREE.BoxGeometry(1, 1, 1);
  const geometries: THREE.BufferGeometry[] = [];

  blocks.forEach(([x, y, z]) => {
    const geo = baseGeo.clone();
    geo.translate(x, y, z);
    geometries.push(geo);
  });

  const mergedGeo = new THREE.BufferGeometry();
  const posCount = geometries.reduce((acc, g) => acc + g.attributes.position.count, 0);
  const positions = new Float32Array(posCount * 3);
  const normals = new Float32Array(posCount * 3);
  const uvs = new Float32Array(posCount * 2);
  const indices: number[] = [];

  let offset = 0;
  let indexOffset = 0;

  geometries.forEach(geo => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const idx = geo.index;

    positions.set(pos.array as Float32Array, offset * 3);
    normals.set(norm.array as Float32Array, offset * 3);
    uvs.set(uv.array as Float32Array, offset * 2);

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + indexOffset);
      }
    }

    offset += pos.count;
    indexOffset += pos.count; 
  });

  mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  mergedGeo.setIndex(indices);

  mergedGeo.computeBoundingBox();
  if (mergedGeo.boundingBox) {
    const center = new THREE.Vector3();
    mergedGeo.boundingBox.getCenter(center);
    mergedGeo.translate(-center.x, -center.y, -center.z);
  }

  return mergedGeo;
};

const getTetrominoGeometry = (type: ShapeType): THREE.BufferGeometry => {
  switch (type) {
    case 'I': return createBlockGeometry([[0,0,0], [1,0,0], [2,0,0], [3,0,0]]);
    case 'O': return createBlockGeometry([[0,0,0], [1,0,0], [0,1,0], [1,1,0]]);
    case 'T': return createBlockGeometry([[0,0,0], [1,0,0], [2,0,0], [1,1,0]]);
    case 'L': return createBlockGeometry([[0,0,0], [1,0,0], [2,0,0], [2,1,0]]);
    case 'J': return createBlockGeometry([[0,0,0], [1,0,0], [2,0,0], [0,1,0]]);
    case 'S': return createBlockGeometry([[0,0,0], [1,0,0], [1,1,0], [2,1,0]]);
    case 'Z': return createBlockGeometry([[0,1,0], [1,1,0], [1,0,0], [2,0,0]]);
  }
};

// 2D Net Helper
const createNetFromGrid = (squares: [number, number][], scale = 12): THREE.BufferGeometry => {
  const uvs: number[] = [];
  
  squares.forEach(([x, y]) => {
    // Transform grid (0..scale) to UV (0..1)
    // Add margin to center
    const u0 = (x + 1) / (scale + 2); 
    const u1 = (x + 2) / (scale + 2);
    const v0 = (y + 1) / (scale + 2);
    const v1 = (y + 2) / (scale + 2);
    
    // Quad (2 triangles)
    uvs.push(u0, v0, u1, v0, u0, v1);
    uvs.push(u1, v0, u1, v1, u0, v1);
  });

  return createNetGeometry(uvs);
};

// Pre-defined Connected Nets (Correct and Incorrect Variants)
// Coordinates are on a generic grid.
const NET_VARIANTS: Record<ShapeType, [number, number][][]> = {
  // I-Piece (Long strip)
  // Correct: Cross-like (4x4 tube unfolding is contiguous)
  // V0: Correct. V1, V2: Incorrect but connected.
  I: [
    // V0 (Correct): 
    //      [T T T T]
    // [L] [F F F F] [R]
    //      [B B B B]
    //      [K K K K]
    [...Array.from({length:4}, (_,i) => [1+i,4] as [number,number]),
     [0,3], ...Array.from({length:4}, (_,i) => [1+i,3] as [number,number]), [5,3],
     ...Array.from({length:4}, (_,i) => [1+i,2] as [number,number]),
     ...Array.from({length:4}, (_,i) => [1+i,1] as [number,number])],
    
    // V1 (Incorrect - L moved to top):
    [...Array.from({length:4}, (_,i) => [1+i,4] as [number,number]), [0,4], // L moved
     ...Array.from({length:4}, (_,i) => [1+i,3] as [number,number]), [5,3],
     ...Array.from({length:4}, (_,i) => [1+i,2] as [number,number]),
     ...Array.from({length:4}, (_,i) => [1+i,1] as [number,number])],

    // V2 (Incorrect - R moved to bottom):
    [...Array.from({length:4}, (_,i) => [1+i,4] as [number,number]),
     [0,3], ...Array.from({length:4}, (_,i) => [1+i,3] as [number,number]),
     ...Array.from({length:4}, (_,i) => [1+i,2] as [number,number]),
     ...Array.from({length:4}, (_,i) => [1+i,1] as [number,number]), [5,1]] // R moved
  ],

  // O-Piece (Cube-ish)
  O: [
    // V0 (Correct)
    // [ ][T][T][ ]
    // [L][F][F][R]
    // [L][F][F][R]
    // [ ][B][B][ ]
    // [ ][B][B][ ] (Back)
    [[2,5],[3,5], // Top
     [1,4],[2,4],[3,4],[4,4], // Row 1
     [1,3],[2,3],[3,3],[4,3], // Row 2
     [2,2],[3,2], // Bot
     [2,1],[3,1]], // Back

    // V1 (Incorrect - Left side shifted up)
    [[2,5],[3,5],
     [1,5],[2,4],[3,4],[4,4], // L shifted to (1,5)
     [1,4],[2,3],[3,3],[4,3], // L shifted to (1,4)
     [2,2],[3,2],
     [2,1],[3,1]],

    // V2 (Incorrect - Top moved to side)
    [[4,5],[5,5], // Top moved right
     [1,4],[2,4],[3,4],[4,4],
     [1,3],[2,3],[3,3],[4,3],
     [2,2],[3,2],
     [2,1],[3,1]]
  ],

  // T-Piece
  T: [
    // V0 (Correct-ish unfolding)
    // Top T, Bot T, perimeter strip.
    // T shape: [2,3][3,3][4,3] & [3,4]
    [[2,3],[3,3],[4,3],[3,4], // Top
     [2,6],[3,6],[4,6],[3,7], // Bot (offset y+3)
     [2,4],[2,5], // Left bridge
     [4,4],[4,5], // Right bridge
     [1,3],[1,4],[1,5],[1,6], // Left strip
     [5,3],[5,4],[5,5],[5,6]], // Right strip

    // V1 (Incorrect - Bot T shifted)
    [[2,3],[3,3],[4,3],[3,4],
     [3,6],[4,6],[5,6],[4,7], // Bot shifted right
     [2,4],[2,5],
     [4,4],[4,5],
     [1,3],[1,4],[1,5],[1,6],
     [5,3],[5,4],[5,5],[5,6]],

    // V2 (Incorrect - Bridge broken/moved)
    [[2,3],[3,3],[4,3],[3,4],
     [2,6],[3,6],[4,6],[3,7],
     [1,7],[1,8], // Bridge moved out
     [4,4],[4,5],
     [1,3],[1,4],[1,5],[1,6],
     [5,3],[5,4],[5,5],[5,6]]
  ],

  // L-Piece
  L: [
    // V0 (Correct)
    // L shape: [2,3][2,4][2,5] & [3,3] (Right L)
    [[2,3],[2,4],[2,5],[3,3], // Top
     [5,3],[5,4],[5,5],[6,3], // Bot
     [3,4],[3,5],[4,3],[4,4],[4,5], // Bridge
     [1,3],[1,4],[1,5], // Left strip
     [6,4],[6,5],[7,3]], // Right strip

    // V1 (Incorrect - Bot L mirrored)
    [[2,3],[2,4],[2,5],[3,3],
     [5,3],[6,3],[6,4],[6,5], // Mirrored L
     [3,4],[3,5],[4,3],[4,4],[4,5],
     [1,3],[1,4],[1,5],
     [6,4],[6,5],[7,3]], // Overlaps? Connectivity ok.

    // V2 (Incorrect - Strip moved)
    [[2,3],[2,4],[2,5],[3,3],
     [5,3],[5,4],[5,5],[6,3],
     [3,4],[3,5],[4,3],[4,4],[4,5],
     [1,2],[1,3],[1,4], // Strip down
     [6,4],[6,5],[7,3]]
  ],

  // J-Piece (Mirror L)
  J: [
    // V0
    [[3,3],[3,4],[3,5],[2,3], // J
     [6,3],[6,4],[6,5],[5,3], // Bot
     [4,3],[4,4],[4,5],[5,4],[5,5], // Bridge
     [1,3],[2,4],[2,5], // Side
     [7,3],[7,4],[7,5]],

    // V1
    [[3,3],[3,4],[3,5],[2,3],
     [6,3],[6,4],[6,5],[5,3],
     [4,3],[4,4],[4,5],[5,4],[5,5],
     [1,2],[2,3],[2,4], // Shifted
     [7,3],[7,4],[7,5]],

    // V2
    [[3,3],[3,4],[3,5],[2,3],
     [6,3],[6,4],[6,5],[5,3],
     [4,3],[4,4],[4,5],[5,4],[5,5],
     [1,3],[2,4],[2,5],
     [7,2],[7,3],[7,4]] // Shifted
  ],

  // S-Piece
  S: [
    // V0
    [[2,3],[3,3],[3,4],[4,4], // S
     [2,6],[3,6],[3,7],[4,7], // Bot
     [2,4],[2,5],[3,5],[4,5],[4,6], // Bridge
     [1,3],[1,4], // Left
     [5,4],[5,5],[5,6]], // Right

    // V1
    [[2,3],[3,3],[3,4],[4,4],
     [2,6],[3,6],[3,7],[4,7],
     [2,4],[2,5],[3,5],[4,5],[4,6],
     [0,3],[0,4], // Shifted out
     [5,4],[5,5],[5,6]],

    // V2
    [[2,3],[3,3],[3,4],[4,4],
     [2,6],[3,6],[3,7],[4,7],
     [2,4],[2,5],[3,5],[4,5],[4,6],
     [1,3],[1,4],
     [6,4],[6,5],[6,6]] // Shifted out
  ],

  // Z-Piece
  Z: [
    // V0
    [[3,3],[4,3],[2,4],[3,4], // Z
     [3,6],[4,6],[2,7],[3,7], // Bot
     [2,5],[2,6],[3,5],[4,4],[4,5], // Bridge
     [1,4],[1,5], // Left
     [5,3],[5,4],[5,5]], // Right

    // V1
    [[3,3],[4,3],[2,4],[3,4],
     [3,6],[4,6],[2,7],[3,7],
     [2,5],[2,6],[3,5],[4,4],[4,5],
     [0,4],[0,5], // Shifted
     [5,3],[5,4],[5,5]],

    // V2
    [[3,3],[4,3],[2,4],[3,4],
     [3,6],[4,6],[2,7],[3,7],
     [2,5],[2,6],[3,5],[4,4],[4,5],
     [1,4],[1,5],
     [6,3],[6,4],[6,5]] // Shifted
  ]
};

const getTetrominoNet = (type: ShapeType, variant: number): THREE.BufferGeometry => {
  const faces = NET_VARIANTS[type][variant % 3];
  return createNetFromGrid(faces, 10);
};

interface LevelData {
  targetGeo: THREE.BufferGeometry;
  options: {
    id: string;
    geo: THREE.BufferGeometry;
    isCorrect: boolean;
  }[];
  shapeName: ShapeType;
}

const generateLevel = (excludeShapes: string[] = []): LevelData => {
  const availableShapes = SHAPES.filter(s => !excludeShapes.includes(s));
  const pool = availableShapes.length > 0 ? availableShapes : SHAPES;
  
  const targetType = pool[Math.floor(Math.random() * pool.length)];
  const targetGeo = getTetrominoGeometry(targetType);

  const optionDefs = [
    { variant: 0, isCorrect: true },
    { variant: 1, isCorrect: false },
    { variant: 2, isCorrect: false }
  ].sort(() => Math.random() - 0.5);

  const options = optionDefs.map((def, idx) => ({
    id: `opt-${idx}`,
    type: targetType,
    geo: getTetrominoNet(targetType, def.variant),
    isCorrect: def.isCorrect
  }));

  return {
    targetGeo,
    options,
    shapeName: targetType
  };
};

export default function UnwrappedUV() {
  const [gameState, setGameState] = useState<"start" | "playing" | "finished">("start");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [usedShapes, setUsedShapes] = useState<string[]>([]);
  const { setWon } = useGameState("unwrapped-uv");

  useEffect(() => {
    if (gameState === "finished") {
      if (score >= 3) {
        setWon(true);
      }
    }
  }, [gameState, score, setWon]);

  const startNewGame = () => {
    setScore(0);
    setRound(1);
    setGameState("playing");
    setFeedback(null);
    setUsedShapes([]);
    // Pass empty array explicitly since state update is async
    const newLevel = generateLevel([]);
    setLevelData(newLevel);
    setUsedShapes([newLevel.shapeName]);
  };

  const createNewLevel = () => {
    const newLevel = generateLevel(usedShapes);
    setLevelData(newLevel);
    setFeedback(null);
    setUsedShapes(prev => [...prev, newLevel.shapeName]);
  };

  const handleOptionClick = (isCorrect: boolean) => {
    if (feedback) return;

    if (isCorrect) setScore(s => s + 1);
    setFeedback(isCorrect ? "correct" : "incorrect");

    setTimeout(() => {
      if (round < ROUNDS_TOTAL) {
        setRound(r => r + 1);
        createNewLevel();
      } else {
        setGameState("finished");
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-5xl mx-auto p-2 md:p-4 space-y-4 md:space-y-8">
      <div className="flex flex-col items-center gap-2 w-full">
        <h1 className="text-xl md:text-3xl font-bold font-mono tracking-tight text-center">UNWRAPPED UV SELECTOR</h1>
        <div className="flex gap-4 text-xs md:text-sm font-mono">
          <span>ROUND: {gameState === "start" ? 0 : round}/{ROUNDS_TOTAL}</span>
          <span>SCORE: {score}</span>
        </div>
      </div>

      {gameState === "start" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Ready to identify Tetromino nets?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <p>
              Select the correct <strong>Unfolded Net</strong> for the displayed 3D Tetromino.
            </p>
            <p className="text-xs text-muted-foreground">
              Watch out for impossible connections and overlapping faces!
            </p>
            <Button onClick={startNewGame} size="lg" className="w-full mt-4">
              START GAME
            </Button>
          </CardContent>
        </Card>
      )}

      {gameState === "playing" && levelData && (
        <div className="flex flex-col lg:flex-row items-center w-full gap-4 lg:gap-8">
          {/* Target Model */}
          <div className="flex-1 w-full flex flex-col items-center justify-center">
             <div className="text-sm font-mono text-muted-foreground mb-2 lg:mb-4">
              TARGET SHAPE: {levelData.shapeName}
             </div>
             <div className="w-full h-[250px] md:h-[400px] relative">
               <ModelViewer geometry={levelData.targetGeo} color={SHAPE_COLORS[levelData.shapeName]} autoRotate={false} />
             </div>
          </div>

          {/* Options Grid */}
          <div className="flex-1 w-full flex flex-col gap-4">
             <div className="text-sm font-mono text-muted-foreground text-center mb-2">
               SELECT THE CORRECT NET
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {levelData.options.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => handleOptionClick(option.isCorrect)}
                    disabled={!!feedback}
                    className={cn(
                      "flex flex-col items-center justify-center p-1 md:p-2 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none bg-slate-900/50",
                      feedback && option.isCorrect ? "border-green-500 bg-green-900/20" : "border-slate-800 hover:border-slate-600",
                      feedback && !option.isCorrect && "opacity-50",
                      feedback && !option.isCorrect && feedback === "incorrect" && "grayscale",
                      option.id === 'correct' && feedback === 'incorrect' && "border-green-500 animate-pulse"
                    )}
                  >
                    <UVCanvas 
                      geometry={option.geo} 
                      width={300} 
                      height={300} 
                      className="w-full h-auto aspect-square"
                    />
                  </button>
                ))}
             </div>
             {feedback && (
               <div className={cn(
                 "text-center text-xl font-bold animate-in fade-in slide-in-from-top-2",
                 feedback === "correct" ? "text-green-400" : "text-red-400"
               )}>
                 {feedback === "correct" ? "CORRECT!" : "WRONG!"}
               </div>
             )}
          </div>
        </div>
      )}

      {gameState === "finished" && (
        <Card className={cn(
          "w-full max-w-md animate-in fade-in slide-in-from-bottom-4",
          score >= 3 ? "border-2 border-green-500 bg-green-500/10" : ""
        )}>
          <CardHeader>
            <CardTitle className={cn(
              "text-center",
              score >= 3 ? "text-green-500" : ""
            )}>
              {score >= 3 ? "VICTORY!" : "GAME OVER"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <div className="text-6xl font-bold mb-4">{score}/{ROUNDS_TOTAL}</div>
            <p className="text-muted-foreground">
              {score === ROUNDS_TOTAL ? "Perfect! You're a block master! 🧱" : 
               score >= 3 ? "Great job! You know your nets! 🎨" : 
               "Keep practicing your nets! 📉"}
            </p>
            <Button onClick={startNewGame} size="lg" className="w-full mt-4">
              PLAY AGAIN
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
