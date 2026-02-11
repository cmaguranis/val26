import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eraser, Eye, CheckCircle2, RotateCcw, Lock } from 'lucide-react';
import { useGameState } from '@/hooks/use-game-index';
import { cn } from '@/lib/utils';
import { gameConfig } from '@/config/game-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Game Configuration
const GAME_CONFIG = gameConfig.invisibleHeart;

type ShapeType = 'heart' | 'square' | 'circle' | 'triangle' | 'star' | 'hexagon';

interface Point {
  x: number;
  y: number;
}

interface ShapeDef {
    id: ShapeType;
    label: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

const SHAPES: ShapeDef[] = [
    { id: 'triangle', label: 'Triangle', difficulty: 'Easy' },
    { id: 'square', label: 'Square', difficulty: 'Easy' },
    { id: 'circle', label: 'Circle', difficulty: 'Medium' },
    { id: 'heart', label: 'Heart', difficulty: 'Medium' },
    { id: 'hexagon', label: 'Hexagon', difficulty: 'Medium' },
    { id: 'star', label: 'Star', difficulty: 'Hard' },
];

// Shape Generators
const generateShapePoints = (type: ShapeType, cx: number, cy: number, scale: number, rotation: number, stretch: { x: number; y: number }, steps = 100): Point[] => {
  const points: Point[] = [];
  
  if (type === 'heart') {
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      const nx = (x / 16) * stretch.x;
      const ny = (-(y + 6) / 16) * stretch.y; 
      
      const rx = nx * Math.cos(rotation) - ny * Math.sin(rotation);
      const ry = nx * Math.sin(rotation) + ny * Math.cos(rotation);

      points.push({ x: cx + rx * scale, y: cy + ry * scale });
    }
  } else if (type === 'square') {
    // Square points from -1 to 1
    const sideSteps = Math.floor(steps / 4);
    
    // Top side: (-1, -1) to (1, -1)
    for(let i=0; i<sideSteps; i++) {
        const t = (i/sideSteps) * 2 - 1;
        points.push({x: t, y: -1});
    }
    // Right side: (1, -1) to (1, 1)
    for(let i=0; i<sideSteps; i++) {
        const t = (i/sideSteps) * 2 - 1;
        points.push({x: 1, y: t});
    }
    // Bottom side: (1, 1) to (-1, 1)
    for(let i=0; i<sideSteps; i++) {
        const t = 1 - (i/sideSteps) * 2;
        points.push({x: t, y: 1});
    }
    // Left side: (-1, 1) to (-1, -1)
    for(let i=0; i<sideSteps; i++) {
        const t = 1 - (i/sideSteps) * 2;
        points.push({x: -1, y: t});
    }
  } else if (type === 'circle') {
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 2 * Math.PI;
        const x = Math.cos(t);
        const y = Math.sin(t);
        points.push({ x, y });
    }
  } else if (type === 'triangle') {
    // Equilateral triangle
    // 3 vertices at angles -90, 30, 150 (if pointing up)
    // Vertices in normalized coords approx: (0,-1), (0.866, 0.5), (-0.866, 0.5)
    const sideSteps = Math.floor(steps / 3);
    const v1 = { x: 0, y: -1 };
    const v2 = { x: Math.sqrt(3)/2, y: 0.5 };
    const v3 = { x: -Math.sqrt(3)/2, y: 0.5 };
    
    // Side 1: v1 -> v2
    for(let i=0; i<sideSteps; i++) {
        const t = i/sideSteps;
        points.push({
            x: v1.x + (v2.x - v1.x) * t,
            y: v1.y + (v2.y - v1.y) * t
        });
    }
    // Side 2: v2 -> v3
    for(let i=0; i<sideSteps; i++) {
        const t = i/sideSteps;
        points.push({
            x: v2.x + (v3.x - v2.x) * t,
            y: v2.y + (v3.y - v2.y) * t
        });
    }
    // Side 3: v3 -> v1
    for(let i=0; i<sideSteps; i++) {
        const t = i/sideSteps;
        points.push({
            x: v3.x + (v1.x - v3.x) * t,
            y: v3.y + (v1.y - v3.y) * t
        });
    }
  } else if (type === 'hexagon') {
    const sideSteps = Math.floor(steps / 6);
    for (let i = 0; i < 6; i++) {
        const angle1 = (i * 60 - 90) * Math.PI / 180; // Start at top (-90 deg)
        const angle2 = ((i + 1) * 60 - 90) * Math.PI / 180;
        const v1 = { x: Math.cos(angle1), y: Math.sin(angle1) };
        const v2 = { x: Math.cos(angle2), y: Math.sin(angle2) };
        
        for (let j = 0; j < sideSteps; j++) {
            const t = j / sideSteps;
            points.push({
                x: v1.x + (v2.x - v1.x) * t,
                y: v1.y + (v2.y - v1.y) * t
            });
        }
    }
  } else if (type === 'star') {
    // 5-point star
    // 10 vertices (5 outer, 5 inner)
    const sideSteps = Math.floor(steps / 10);
    const innerRadius = 0.4; // Ratio of inner to outer radius
    
    for (let i = 0; i < 10; i++) {
        // Outer points are at even indices, inner at odd
        const r1 = i % 2 === 0 ? 1 : innerRadius;
        const r2 = (i + 1) % 2 === 0 ? 1 : innerRadius;
        
        const angle1 = (i * 36 - 90) * Math.PI / 180;
        const angle2 = ((i + 1) * 36 - 90) * Math.PI / 180;
        
        const v1 = { x: Math.cos(angle1) * r1, y: Math.sin(angle1) * r1 };
        const v2 = { x: Math.cos(angle2) * r2, y: Math.sin(angle2) * r2 };
        
        for (let j = 0; j < sideSteps; j++) {
            const t = j / sideSteps;
            points.push({
                x: v1.x + (v2.x - v1.x) * t,
                y: v1.y + (v2.y - v1.y) * t
            });
        }
    }
  }
  
  // Transform points (apply stretch, rotation, scale, translate)
  // Note: Heart was already transformed in loop, so we filter it out or standardize logic.
  // Standardizing logic is better.
  
  // Wait, the previous heart logic did transformation inside the loop.
  // The new logic for other shapes generates normalized points (-1 to 1) then transforms.
  // Let's adapt the heart loop to be consistent or just return transformed points.
  
  if (type === 'heart') {
      // Heart logic returns already transformed points, so we just return them.
      return points;
  }

  // For all other shapes that generated normalized points:
  return points.map(p => {
      const nx = p.x * stretch.x;
      const ny = p.y * stretch.y;
      const rx = nx * Math.cos(rotation) - ny * Math.sin(rotation);
      const ry = nx * Math.sin(rotation) + ny * Math.cos(rotation);
      return { x: cx + rx * scale, y: cy + ry * scale };
  });
};

// Grading Function
const gradeDrawing = (userPaths: { x: number; y: number }[][], targetPoints: { x: number; y: number }[]) => {
  const userPoints = userPaths.flat();
  if (userPoints.length < 10) return { score: 0, feedback: "Draw more!" };

  let coveredPoints = 0;
  const coverageThreshold = 20; 
  
  targetPoints.forEach(tp => {
    const isCovered = userPoints.some(up => {
      const dx = up.x - tp.x;
      const dy = up.y - tp.y;
      return (dx * dx + dy * dy) < (coverageThreshold * coverageThreshold);
    });
    if (isCovered) coveredPoints++;
  });
  
  const coverageScore = coveredPoints / targetPoints.length;

  let totalError = 0;
  userPoints.forEach(up => {
    let minDistSq = Infinity;
    targetPoints.forEach(tp => {
      const dx = up.x - tp.x;
      const dy = up.y - tp.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) minDistSq = distSq;
    });
    totalError += Math.sqrt(minDistSq);
  });
  
  const averageError = totalError / userPoints.length;
  const errorTolerance = 40;
  const accuracyScore = Math.max(0, 1 - (averageError / errorTolerance));

  const finalScore = (coverageScore * 0.6) + (accuracyScore * 0.4);

  return {
    score: finalScore,
    coverage: coverageScore,
    accuracy: accuracyScore,
    feedback: finalScore > GAME_CONFIG.gradingThreshold ? "Great job!" : (coverageScore < 0.5 ? "Trace the whole shape!" : "Try to be more accurate!")
  };
};

// Helper to check if points are within canvas
const arePointsInBounds = (points: { x: number; y: number }[], width: number, height: number, padding: number) => {
    return points.every(p => 
        p.x >= padding && 
        p.x <= width - padding && 
        p.y >= padding && 
        p.y <= height - padding
    );
};

export default function InvisibleHeart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isWon, setWon } = useGameState('invisible-heart');
  
  // State for UI
  const [currentShape, setCurrentShape] = useState<ShapeType>('heart');
  const [rotation, setRotation] = useState(0);
  const [stretch, setStretch] = useState({ x: 1, y: 1 });
  const [isRevealed, setIsRevealed] = useState(false);
  const [scoreData, setScoreData] = useState<{ score: number, feedback: string } | null>(null);
  const [hasWonCurrent, setHasWonCurrent] = useState(false);
  
  // Refs for drawing state
  const pathsRef = useRef<{ x: number; y: number }[][]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const guideDotsRef = useRef<number[]>([]); 
  
  // Initialize random rotation and stretch on mount
  useEffect(() => {
    setRotation(Math.random() * Math.PI * 2);
    setStretch({
        x: 0.8 + Math.random() * 0.4, 
        y: 0.8 + Math.random() * 0.4
    });
  }, []);

  const resetGame = () => {
    setRotation(Math.random() * Math.PI * 2);
    setStretch({
        x: 0.8 + Math.random() * 0.4, 
        y: 0.8 + Math.random() * 0.4
    });
    pathsRef.current = [];
    currentPathRef.current = [];
    guideDotsRef.current = [];
    setScoreData(null);
    setHasWonCurrent(false);
    setIsRevealed(false);
    requestAnimationFrame(draw);
  };

  // Change shape handler
  const handleShapeChange = (value: string) => {
      setCurrentShape(value as ShapeType);
      resetGame();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the DPR and logical size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    const cx = width / 2;
    const cy = height / 2;
    
    // Adaptive Scaling to ensure fit
    let currentScale = Math.min(width, height) * 0.45;
    const padding = 20;

    // Generate initial points
    let shapePoints = generateShapePoints(currentShape, cx, cy, currentScale, rotation, stretch);

    // Iteratively reduce scale until points fit within bounds
    let attempts = 0;
    while (!arePointsInBounds(shapePoints, width, height, padding) && attempts < 10) {
        currentScale *= 0.9;
        shapePoints = generateShapePoints(currentShape, cx, cy, currentScale, rotation, stretch);
        attempts++;
    }
    
    // Create Path from Points
    const shapePath = new Path2D();
    if (shapePoints.length > 0) {
      shapePath.moveTo(shapePoints[0].x, shapePoints[0].y);
      for (let i = 1; i < shapePoints.length; i++) {
        shapePath.lineTo(shapePoints[i].x, shapePoints[i].y);
      }
      shapePath.closePath();
    }

    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Red Guide Dots (4 for heart, 3 for others)
    if (guideDotsRef.current.length === 0 && shapePoints.length > 0) {
        const totalPoints = shapePoints.length;
        const dotCount = currentShape === 'heart' ? 4 : GAME_CONFIG.dotCount;
        
        if (currentShape === 'heart') {
            // For heart: always include the tip (index 0) and distribute the rest evenly
            guideDotsRef.current.push(0); // Tip of the heart
            const interval = Math.floor(totalPoints / dotCount);
            for (let i = 1; i < dotCount; i++) {
                const idx = (i * interval) % totalPoints;
                guideDotsRef.current.push(idx);
            }
        } else {
            // For other shapes: distribute evenly with random starting position
            const interval = Math.floor(totalPoints / dotCount);
            const startOffset = Math.floor(Math.random() * interval);
            
            for (let i = 0; i < dotCount; i++) {
                const idx = (startOffset + i * interval) % totalPoints;
                guideDotsRef.current.push(idx);
            }
        }
    }
    
    ctx.save();
    ctx.fillStyle = '#ef4444'; // Red-500
    guideDotsRef.current.forEach(idx => {
        const safeIdx = idx % shapePoints.length;
        const p = shapePoints[safeIdx];
        if (p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.restore();

    // 2. Draw User Paths
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = hasWonCurrent ? '#22c55e' : '#ef4444'; 
    
    const drawPath = (path: {x: number, y: number}[]) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    };

    pathsRef.current.forEach(drawPath);
    if (currentPathRef.current.length > 0) {
      drawPath(currentPathRef.current);
    }

    // 3. Draw Reveal Outline
    if (isRevealed || hasWonCurrent) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = hasWonCurrent ? '#22c55e' : '#2563eb'; // Green if won, else Blue
      ctx.setLineDash([10, 10]); 
      ctx.stroke(shapePath); 
      ctx.restore();
    }

  }, [currentShape, rotation, stretch, isRevealed, hasWonCurrent]); 

  // Handle Resize
  useEffect(() => {
    const handleResize = () => requestAnimationFrame(draw);
    window.addEventListener('resize', handleResize);
    requestAnimationFrame(draw);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Re-draw triggers
  useEffect(() => {
    requestAnimationFrame(draw);
  }, [draw]); 

  // Input Handlers
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault(); 
    if (hasWonCurrent) return; 
    isDrawingRef.current = true;
    const point = getPoint(e);
    currentPathRef.current = [point];
    requestAnimationFrame(draw);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawingRef.current) return;
    const point = getPoint(e);
    currentPathRef.current.push(point);
    requestAnimationFrame(draw);
  };

  const handleEnd = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentPathRef.current.length > 0) {
        pathsRef.current.push([...currentPathRef.current]);
      }
      currentPathRef.current = [];
      requestAnimationFrame(draw);
    }
  };

  const clearCanvas = () => {
    pathsRef.current = [];
    currentPathRef.current = [];
    setScoreData(null);
    setIsRevealed(false);
    setHasWonCurrent(false);
    requestAnimationFrame(draw);
  };

  const handleCheck = () => {
    if (pathsRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const cx = width / 2;
    const cy = height / 2;
    
    // Re-calculate target points
    let currentScale = Math.min(width, height) * 0.45;
    const padding = 20;
    let shapePoints = generateShapePoints(currentShape, cx, cy, currentScale, rotation, stretch);

    let attempts = 0;
    while (!arePointsInBounds(shapePoints, width, height, padding) && attempts < 10) {
        currentScale *= 0.9;
        shapePoints = generateShapePoints(currentShape, cx, cy, currentScale, rotation, stretch);
        attempts++;
    }

    const result = gradeDrawing(pathsRef.current, shapePoints);
    setScoreData(result);

    if (result.score > GAME_CONFIG.gradingThreshold) {
        // Only unlock on heart win
        if (currentShape === 'heart') {
            setWon(true);
        }
        setHasWonCurrent(true);
    } else {
        setIsRevealed(true); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 h-full w-full max-w-4xl mx-auto p-4 select-none">
      <div className="text-center space-y-4 relative w-full">
        <h1 className="text-3xl font-bold tracking-tight">Invisible Shape</h1>
        
        
        <div className="flex flex-col items-center gap-2">
            <div className="flex justify-center items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Shape:</span>
                <Select value={currentShape} onValueChange={handleShapeChange}>
                    <SelectTrigger className="w-[270px]">
                        <SelectValue placeholder="Select Shape" />
                    </SelectTrigger>
                    <SelectContent>
                        {SHAPES.map(shape => {
                            const isLocked = !isWon && shape.id !== 'heart';
                            return (
                                <SelectItem key={shape.id} value={shape.id} disabled={isLocked}>
                                    <div className="flex justify-start items-center w-full min-w-[120px] gap-3">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full font-medium w-[60px] text-center",
                                            isLocked && "bg-slate-100 text-slate-500",
                                            !isLocked && shape.difficulty === 'Easy' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                            !isLocked && shape.difficulty === 'Medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                                            !isLocked && shape.difficulty === 'Hard' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                        )}>
                                            {shape.difficulty}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                                            <span>{shape.label}</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
            {!isWon && (
                <p className="text-xs text-muted-foreground">
                  Beat the Heart to unlock all shapes!
                </p>
            )}
        </div>
      </div>

      <div className="relative">
        <Card className={cn(
            "p-1 border-2 border-dashed w-full max-w-[600px] aspect-square relative bg-white/20 shadow-sm overflow-hidden transition-colors duration-500",
            hasWonCurrent ? "border-green-500 bg-green-50" : "border-slate-200"
        )} ref={containerRef}>
            <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair block"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            />
        </Card>
        
        {/* Score Overlay */}
        {scoreData && (
            <div className={cn(
                "absolute top-4 right-4 px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-in fade-in slide-in-from-bottom-2",
                hasWonCurrent ? "bg-green-500 text-white" : "bg-white text-slate-800 border"
            )}>
                {Math.round(scoreData.score * 100)}% - {scoreData.feedback}
            </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" onClick={clearCanvas} className="gap-2" disabled={hasWonCurrent}>
          <Eraser className="w-4 h-4" />
          Clear
        </Button>
        
        <Button 
            variant="outline" 
            onClick={resetGame} 
            className="gap-2"
        >
            <RotateCcw className="w-4 h-4" />
            New Shape
        </Button>

        <Button 
          variant={hasWonCurrent ? "secondary" : "default"} 
          onClick={handleCheck}
          className={cn("gap-2 min-w-[120px]", hasWonCurrent && "bg-green-600 text-white hover:bg-green-700")}
          disabled={hasWonCurrent}
        >
            {hasWonCurrent ? (
                <>
                <CheckCircle2 className="w-4 h-4" />
                Solved!
                </>
            ) : (
                <>
                <Eye className="w-4 h-4" />
                Check & Reveal
                </>
            )}
        </Button>
      </div>
      
      
      <div className="text-xs text-muted-foreground">
        Tip: Imagine lines connecting the red dots.
      </div>
    </div>
  );
}
