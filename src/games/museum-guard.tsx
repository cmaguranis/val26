import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Minus, RotateCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { gameConfig } from '@/config/game-config';
import { useGameState } from '@/hooks/use-game-index';
import { cn } from '@/lib/utils';

const CONFIG = gameConfig.museumGuard;


// Guard colors for visual distinction
const GUARD_COLORS = [
  { main: '#3b82f6', light: '#60a5fa', dark: '#1e40af' }, // blue
  { main: '#10b981', light: '#34d399', dark: '#059669' }, // green
  { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' }, // amber
];

interface Point {
  x: number;
  y: number;
}

interface Guard {
  pos: Point;
  angle: number;
  id: number;
}

interface DragState {
  guardIndex: number;
  type: 'body' | 'arrow'; // dragging body to move, arrow to rotate
}

interface RoomShape {
  vertices: Point[];
}

interface Level {
  id: number;
  name: string;
  requiredGuards: number;
  maxGuards: number;
  room: RoomShape;
  interiorWalls: Point[][];
  artPosition: Point;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  coverageThreshold: number; // percentage required to complete (0.0 to 1.0)
}

// Define all 5 levels
const LEVELS: Level[] = [
  // Level 1: Simple L-shape (2 guards required) - Easy
  {
    id: 1,
    name: "The Entrance Hall",
    requiredGuards: 2,
    maxGuards: 4,
    room: {
      vertices: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 350 },
        { x: 400, y: 350 },
        { x: 400, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ]
    },
    interiorWalls: [],
    artPosition: { x: 250, y: 450 },
    description: "A simple L-shaped gallery. Perfect for beginners.",
    difficulty: 'easy',
    coverageThreshold: 0.95
  },
  
  // Level 2: Two rooms with narrow passage (2 guards required) - Easy
  {
    id: 2,
    name: "The Divided Wing",
    requiredGuards: 2,
    maxGuards: 4,
    room: {
      vertices: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ]
    },
    interiorWalls: [
      [{ x: 100, y: 300 }, { x: 350, y: 300 }],
      [{ x: 450, y: 300 }, { x: 700, y: 300 }],
    ],
    artPosition: { x: 250, y: 200 },
    description: "Two chambers connected by a narrow passage.",
    difficulty: 'easy',
    coverageThreshold: 0.95
  },
  
  // Level 3: Cross-shaped with central obstacle (3 guards required) - Medium
  {
    id: 3,
    name: "The Central Hall",
    requiredGuards: 3,
    maxGuards: 5,
    room: {
      vertices: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ]
    },
    interiorWalls: [
      // Central pillar
      [{ x: 350, y: 250 }, { x: 450, y: 250 }],
      [{ x: 450, y: 250 }, { x: 450, y: 350 }],
      [{ x: 450, y: 350 }, { x: 350, y: 350 }],
      [{ x: 350, y: 350 }, { x: 350, y: 250 }],
      // Side walls
      [{ x: 250, y: 100 }, { x: 250, y: 200 }],
      [{ x: 550, y: 400 }, { x: 550, y: 500 }],
    ],
    artPosition: { x: 650, y: 450 },
    description: "A hall with a central pillar blocking sight lines.",
    difficulty: 'medium',
    coverageThreshold: 0.90
  },
  
  // Level 4: Comb pattern (3 guards required) - Medium
  {
    id: 4,
    name: "The Comb Gallery",
    requiredGuards: 3,
    maxGuards: 5,
    room: {
      vertices: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ]
    },
    interiorWalls: [
      [{ x: 250, y: 100 }, { x: 250, y: 300 }],
      [{ x: 400, y: 200 }, { x: 400, y: 500 }],
      [{ x: 550, y: 100 }, { x: 550, y: 350 }],
      [{ x: 100, y: 300 }, { x: 200, y: 300 }],
    ],
    artPosition: { x: 650, y: 450 },
    description: "Multiple corridors create complex sight lines.",
    difficulty: 'medium',
    coverageThreshold: 0.90
  },
  
  // Level 5: Complex maze (5 guards required) - Hard
  {
    id: 5,
    name: "The Master's Maze",
    requiredGuards: 5,
    maxGuards: 7,
    room: {
      vertices: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 },
        { x: 100, y: 100 },
      ]
    },
    interiorWalls: [
      // Top row
      [{ x: 200, y: 100 }, { x: 200, y: 200 }],
      [{ x: 350, y: 100 }, { x: 350, y: 250 }],
      [{ x: 500, y: 100 }, { x: 500, y: 200 }],
      [{ x: 600, y: 100 }, { x: 600, y: 300 }],
      // Middle row
      [{ x: 100, y: 250 }, { x: 250, y: 250 }],
      [{ x: 450, y: 250 }, { x: 700, y: 250 }],
      // Bottom row
      [{ x: 200, y: 350 }, { x: 200, y: 500 }],
      [{ x: 400, y: 300 }, { x: 400, y: 500 }],
      [{ x: 550, y: 350 }, { x: 550, y: 450 }],
      // Horizontal
      [{ x: 100, y: 400 }, { x: 150, y: 400 }],
      [{ x: 500, y: 400 }, { x: 650, y: 400 }],
    ],
    artPosition: { x: 650, y: 150 },
    description: "The ultimate challenge - a complex maze of walls.",
    difficulty: 'hard',
    coverageThreshold: 0.85
  },
];

// Generate sample points across the entire museum floor for coverage checking
const generateFloorSamplePoints = (room: RoomShape): Point[] => {
  const points: Point[] = [];
  const gridSpacing = 30; // Sample every 30 pixels
  
  // Find bounds
  const minX = Math.min(...room.vertices.map(v => v.x));
  const maxX = Math.max(...room.vertices.map(v => v.x));
  const minY = Math.min(...room.vertices.map(v => v.y));
  const maxY = Math.max(...room.vertices.map(v => v.y));
  
  // Sample points in a grid across the room bounds
  for (let x = minX + 10; x < maxX - 10; x += gridSpacing) {
    for (let y = minY + 10; y < maxY - 10; y += gridSpacing) {
      const point = { x, y };
      // Only include points that are actually inside the room polygon
      if (isPointInPolygon(point, room.vertices)) {
        points.push(point);
      }
    }
  }
  
  return points;
};

// Initialize wall segments for a given level
const getAllWallSegments = (level: Level): Point[][] => {
  const segments: Point[][] = [];
  
  // Add room boundary walls
  for (let i = 0; i < level.room.vertices.length - 1; i++) {
    segments.push([level.room.vertices[i], level.room.vertices[i + 1]]);
  }
  
  // Add interior walls
  level.interiorWalls.forEach(wall => {
    segments.push(wall);
  });
  
  return segments;
};

// Ray casting for line-segment intersection
const rayIntersectsSegment = (
  rayOrigin: Point,
  rayDir: Point,
  segStart: Point,
  segEnd: Point
): { hit: boolean; dist: number; point?: Point } => {
  const v1 = { x: rayOrigin.x - segStart.x, y: rayOrigin.y - segStart.y };
  const v2 = { x: segEnd.x - segStart.x, y: segEnd.y - segStart.y };
  const v3 = { x: -rayDir.y, y: rayDir.x };

  const dot = v2.x * v3.x + v2.y * v3.y;
  if (Math.abs(dot) < 0.000001) return { hit: false, dist: Infinity };

  const t1 = (v2.x * v1.y - v2.y * v1.x) / dot;
  const t2 = (v1.x * v3.x + v1.y * v3.y) / dot;

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return {
      hit: true,
      dist: t1,
      point: {
        x: rayOrigin.x + rayDir.x * t1,
        y: rayOrigin.y + rayDir.y * t1
      }
    };
  }

  return { hit: false, dist: Infinity };
};

// Cast a single ray and find the closest intersection
const castRay = (origin: Point, angle: number, allWallSegments: Point[][], maxDist: number = 1000): Point => {
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  let closestDist = maxDist;
  let closestPoint = {
    x: origin.x + dir.x * maxDist,
    y: origin.y + dir.y * maxDist
  };

  allWallSegments.forEach(segment => {
    const result = rayIntersectsSegment(origin, dir, segment[0], segment[1]);
    if (result.hit && result.point && result.dist < closestDist) {
      closestDist = result.dist;
      closestPoint = result.point;
    }
  });

  return closestPoint;
};

// Calculate visibility polygon for a guard with cone vision
const calculateVisibilityPolygon = (guard: Guard, allWallSegments: Point[][]): Point[] => {
  const origin = guard.pos;
  
  // Vision cone parameters
  const coneAngle = Math.PI * 0.6; // 108 degrees cone (adjustable)
  const startAngle = guard.angle - coneAngle / 2;
  const endAngle = guard.angle + coneAngle / 2;

  // Helper to adjust angle to be within [startAngle, startAngle + 2PI)
  // This ensures we can sort angles monotonically from startAngle to endAngle
  // regardless of PI wrapping or guard rotation count
  const adjustAngle = (a: number) => {
    const twoPi = 2 * Math.PI;
    let delta = a - startAngle;
    // Normalize delta to [0, 2PI)
    delta = delta - Math.floor(delta / twoPi) * twoPi;
    return startAngle + delta;
  };

  // Collect all unique angles to vertices and nearby angles within the cone
  const angles: number[] = [];
  
  allWallSegments.forEach(segment => {
    segment.forEach(vertex => {
      const rawAngle = Math.atan2(vertex.y - origin.y, vertex.x - origin.x);
      const adjustedAngle = adjustAngle(rawAngle);
      
      // Check if angle is within cone (with small margin)
      if (adjustedAngle <= endAngle + 0.0001) {
        angles.push(adjustedAngle - 0.0001);
        angles.push(adjustedAngle);
        angles.push(adjustedAngle + 0.0001);
      }
    });
  });

  // Cast rays within the cone
  const raysInCone = 60; // Number of rays in the cone
  for (let i = 0; i <= raysInCone; i++) {
    const angle = startAngle + (i / raysInCone) * coneAngle;
    angles.push(angle);
  }

  // Always include the cone edges
  angles.push(startAngle);
  angles.push(endAngle);

  // Sort angles
  const uniqueAngles = Array.from(new Set(angles)).sort((a, b) => a - b);

  // Build polygon - start from the guard's origin position to form a proper cone
  const points: Point[] = [origin];
  
  uniqueAngles.forEach(angle => {
    const point = castRay(origin, angle, allWallSegments);
    // Only add the point if it's different from the last one (avoid duplicates)
    if (points.length === 1 || 
        Math.abs(points[points.length - 1].x - point.x) > 0.1 || 
        Math.abs(points[points.length - 1].y - point.y) > 0.1) {
      points.push(point);
    }
  });
  
  // Close the polygon back to the origin to complete the cone shape
  points.push(origin);

  return points;
};

// Point in polygon test using ray casting algorithm
const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Check if a point is covered by any guard's visibility
const isPointVisible = (point: Point, guards: Guard[], allWallSegments: Point[][]): boolean => {
  return guards.some(guard => {
    const visPolygon = calculateVisibilityPolygon(guard, allWallSegments);
    return isPointInPolygon(point, visPolygon);
  });
};

export default function MuseumGuard() {
  const { setWon } = useGameState('museum-guard');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0); // Track current level (0-indexed)
  const [guards, setGuards] = useState<Guard[]>([{ pos: { x: 300, y: 300 }, angle: 0, id: 0 }]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredGuard, setHoveredGuard] = useState<number | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<number | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [levelScore, setLevelScore] = useState(0); // Score for current level
  const [artIsWatched, setArtIsWatched] = useState(false); // Track if art is in any vision cone
  const [guardsWatchingArt, setGuardsWatchingArt] = useState(0); // Count of guards watching art
  const [isLandscape, setIsLandscape] = useState(true);
  const [canvasScale, setCanvasScale] = useState(1);
  const [floorSamplePoints, setFloorSamplePoints] = useState<Point[]>(() => generateFloorSamplePoints(LEVELS[0].room));
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set()); // Track completed levels
  const nextGuardIdRef = useRef(1);
  const allWallSegmentsRef = useRef<Point[][]>(getAllWallSegments(LEVELS[0]));
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const level = LEVELS[currentLevel];

  // Load completed levels from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('museum_guard_completed_levels');
    if (saved) {
      try {
        const levels = JSON.parse(saved) as number[];
        setCompletedLevels(new Set(levels));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Detect orientation and calculate scale for mobile
  useEffect(() => {
    const handleResize = () => {
      const isLandscapeOrientation = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeOrientation);

      // Calculate scale to fit the canvas on screen
      const maxWidth = Math.min(window.innerWidth - 32, CONFIG.canvasWidth); // 32px for padding
      const maxHeight = Math.min(window.innerHeight - 300, CONFIG.canvasHeight); // 300px for controls
      const scaleX = maxWidth / CONFIG.canvasWidth;
      const scaleY = maxHeight / CONFIG.canvasHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      setCanvasScale(scale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const addGuard = () => {
    if (guards.length >= level.maxGuards) return;
    
    const newGuard: Guard = {
      pos: { x: 400, y: 300 },
      angle: 0,
      id: nextGuardIdRef.current++
    };
    
    setGuards([...guards, newGuard]);
  };

  const removeGuard = () => {
    // Allow removing guards down to 0 (no minimum now)
    if (guards.length <= 0) return;
    setGuards(guards.slice(0, -1));
  };

  const resetLevel = () => {
    // Reset with minimum required guards in valid positions
    const initialGuards: Guard[] = [];
    for (let i = 0; i < level.requiredGuards; i++) {
      const offset = i * 50;
      initialGuards.push({
        pos: {
          x: Math.max(300 + offset, level.room.vertices[0].x + CONFIG.guardRadius + 20),
          y: Math.max(300, level.room.vertices[0].y + CONFIG.guardRadius + 20)
        },
        angle: 0,
        id: i
      });
    }
    setGuards(initialGuards);
    nextGuardIdRef.current = level.requiredGuards;
    setIsComplete(false);
    setCoverage(0);
  };
  
  const changeLevel = (newLevelIndex: number) => {
    if (newLevelIndex < 0 || newLevelIndex >= LEVELS.length) return;
    
    setCurrentLevel(newLevelIndex);
    const newLevel = LEVELS[newLevelIndex];
    
    // Update wall segments and floor sample points
    allWallSegmentsRef.current = getAllWallSegments(newLevel);
    setFloorSamplePoints(generateFloorSamplePoints(newLevel.room));
    
    // Reset guards for new level
    const initialGuards: Guard[] = [];
    for (let i = 0; i < newLevel.requiredGuards; i++) {
      const offset = i * 50;
      initialGuards.push({
        pos: {
          x: Math.max(300 + offset, newLevel.room.vertices[0].x + CONFIG.guardRadius + 20),
          y: Math.max(300, newLevel.room.vertices[0].y + CONFIG.guardRadius + 20)
        },
        angle: 0,
        id: i
      });
    }
    setGuards(initialGuards);
    nextGuardIdRef.current = newLevel.requiredGuards;
    setIsComplete(false);
    setCoverage(0);
  };
  
  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      changeLevel(currentLevel + 1);
    }
  };
  
  const previousLevel = () => {
    if (currentLevel > 0) {
      changeLevel(currentLevel - 1);
    }
  };

  // Calculate coverage of the entire museum floor
  const calculateCoverage = useCallback(() => {
    if (guards.length === 0) {
      setCoverage(0);
      setIsComplete(false);
      setLevelScore(0);
      setArtIsWatched(false);
      setGuardsWatchingArt(0);
      return;
    }

    // Count how many floor sample points are visible
    let coveredCount = 0;
    
    floorSamplePoints.forEach(point => {
      if (isPointVisible(point, guards, allWallSegmentsRef.current)) {
        coveredCount++;
      }
    });

    const coveragePercent = coveredCount / floorSamplePoints.length;
    setCoverage(coveragePercent);

    // Check which guards can see the art piece
    let watchingCount = 0;
    guards.forEach(guard => {
      const visPolygon = calculateVisibilityPolygon(guard, allWallSegmentsRef.current);
      if (isPointInPolygon(level.artPosition, visPolygon)) {
        watchingCount++;
      }
    });
    
    setGuardsWatchingArt(watchingCount);
    setArtIsWatched(watchingCount > 0);

    // Update completion status using level-specific threshold
    const shouldBeComplete = coveragePercent >= level.coverageThreshold;
    setIsComplete(shouldBeComplete);
    
    // Calculate and update score (depends on guardsWatchingArt, so it will update in next render)
    const baseScore = 5;
    const guardDiff = level.requiredGuards - guards.length;
    const newScore = Math.max(0, baseScore + (guardDiff * 2) + watchingCount);
    setLevelScore(newScore);
    
    // Mark current level as complete if threshold is met
    if (shouldBeComplete && !completedLevels.has(currentLevel)) {
      const newCompletedLevels = new Set(completedLevels);
      newCompletedLevels.add(currentLevel);
      setCompletedLevels(newCompletedLevels);
      
      // Save to localStorage
      localStorage.setItem('museum_guard_completed_levels', JSON.stringify(Array.from(newCompletedLevels)));
      
      // Check if levels 1, 2, and 3 (indices 0, 1, 2) are all complete
      if (newCompletedLevels.has(0) && newCompletedLevels.has(1) && newCompletedLevels.has(2)) {
        setWon(true);
      }
    }
  }, [guards, floorSamplePoints, level.coverageThreshold, level.artPosition, level.requiredGuards, setWon, currentLevel, completedLevels]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = CONFIG.floorColor;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Draw room walls
    ctx.strokeStyle = CONFIG.wallColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    level.room.vertices.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.stroke();

    // Draw interior walls
    ctx.strokeStyle = CONFIG.wallColor;
    ctx.lineWidth = 4;
    level.interiorWalls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall[0].x, wall[0].y);
      ctx.lineTo(wall[1].x, wall[1].y);
      ctx.stroke();
    });

    // Draw visibility polygons for each guard
    guards.forEach((guard, idx) => {
      const colors = GUARD_COLORS[idx % GUARD_COLORS.length];
      const visPolygon = calculateVisibilityPolygon(guard, allWallSegmentsRef.current);

      // Fill visibility area with guard's color
      ctx.fillStyle = `${colors.main}26`; // Add 15% opacity (26 in hex = ~15%)
      ctx.beginPath();
      visPolygon.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();

      // Draw visibility border with guard's color
      ctx.strokeStyle = `${colors.main}66`; // Add 40% opacity (66 in hex = ~40%)
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw art piece - turns green when watched by any guard or when level is complete
    const artColor = (artIsWatched || isComplete) ? '#10b981' : CONFIG.artColor; // green when watched or complete
    const artBorderColor = (artIsWatched || isComplete) ? '#059669' : '#000'; // darker green border
    const artTextColor = (artIsWatched || isComplete) ? '#fff' : '#000'; // white text
    
    ctx.fillStyle = artColor;
    ctx.beginPath();
    ctx.arc(level.artPosition.x, level.artPosition.y, CONFIG.artRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = artBorderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw art label
    ctx.fillStyle = artTextColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ART', level.artPosition.x, level.artPosition.y + 4);

    // Draw guards
    guards.forEach((guard, idx) => {
      const colors = GUARD_COLORS[idx % GUARD_COLORS.length];
      const isBodyHovered = hoveredGuard === idx;
      const isArrowHovered = hoveredArrow === idx;
      const isBodyDragged = dragState?.guardIndex === idx && dragState?.type === 'body';
      const isArrowDragged = dragState?.guardIndex === idx && dragState?.type === 'arrow';
      
      // Guard body
      ctx.fillStyle = isBodyDragged ? colors.light : colors.main;
      ctx.beginPath();
      ctx.arc(guard.pos.x, guard.pos.y, CONFIG.guardRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.dark;
      ctx.lineWidth = isBodyHovered ? 3 : 2;
      ctx.stroke();

      // Direction indicator (pointing forward) - enhanced as drag handle
      const dirLength = CONFIG.guardRadius * 3.6;
      const dirX = guard.pos.x + Math.cos(guard.angle) * dirLength;
      const dirY = guard.pos.y + Math.sin(guard.angle) * dirLength;
      
      // Draw handle circle at arrow tip
      ctx.fillStyle = isArrowDragged ? colors.light : (isArrowHovered ? colors.light : colors.main);
      ctx.beginPath();
      ctx.arc(dirX, dirY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.dark;
      ctx.lineWidth = isArrowHovered || isArrowDragged ? 3 : 2;
      ctx.stroke();
      
      // Draw line from body to handle
      ctx.strokeStyle = colors.dark;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(guard.pos.x, guard.pos.y);
      ctx.lineTo(dirX, dirY);
      ctx.stroke();
      
      // Arrow head for direction (pointing outward from handle)
      const arrowSize = 6;
      const arrowAngle = 0.4;
      ctx.strokeStyle = colors.dark;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dirX, dirY);
      ctx.lineTo(
        dirX + arrowSize * Math.cos(guard.angle - arrowAngle),
        dirY + arrowSize * Math.sin(guard.angle - arrowAngle)
      );
      ctx.moveTo(dirX, dirY);
      ctx.lineTo(
        dirX + arrowSize * Math.cos(guard.angle + arrowAngle),
        dirY + arrowSize * Math.sin(guard.angle + arrowAngle)
      );
      ctx.stroke();

      // Guard label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`G${idx + 1}`, guard.pos.x, guard.pos.y + 4);
    });
  }, [guards, dragState, hoveredGuard, hoveredArrow, isComplete, artIsWatched, level]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Mouse handlers (with touch support)
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      // Touch event
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Account for canvas scaling
    return {
      x: (clientX - rect.left) / canvasScale,
      y: (clientY - rect.top) / canvasScale
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behavior
    const pos = getMousePos(e);
    
    // Check if clicking on a guard's arrow or body
    for (let idx = 0; idx < guards.length; idx++) {
      const guard = guards[idx];
      
      // Check arrow first (has priority)
      const dirLength = CONFIG.guardRadius * 3.6;
      const arrowX = guard.pos.x + Math.cos(guard.angle) * dirLength;
      const arrowY = guard.pos.y + Math.sin(guard.angle) * dirLength;
      const arrowDist = Math.sqrt(Math.pow(pos.x - arrowX, 2) + Math.pow(pos.y - arrowY, 2));
      
      if (arrowDist < 15) { // 15px hit radius for arrow
        setDragState({ guardIndex: idx, type: 'arrow' });
        return;
      }
      
      // Check body
      const bodyDist = Math.sqrt(Math.pow(pos.x - guard.pos.x, 2) + Math.pow(pos.y - guard.pos.y, 2));
      if (bodyDist < CONFIG.guardRadius) {
        setDragState({ guardIndex: idx, type: 'body' });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behavior
    const pos = getMousePos(e);
    
    if (dragState !== null) {
      const newGuards = [...guards];
      
      if (dragState.type === 'body') {
        // Dragging body - move guard (constrained to room bounds)
        const minX = Math.min(...level.room.vertices.map(v => v.x));
        const maxX = Math.max(...level.room.vertices.map(v => v.x));
        const minY = Math.min(...level.room.vertices.map(v => v.y));
        const maxY = Math.max(...level.room.vertices.map(v => v.y));
        
        const constrainedPos = {
          x: Math.max(
            minX + CONFIG.guardRadius,
            Math.min(maxX - CONFIG.guardRadius, pos.x)
          ),
          y: Math.max(
            minY + CONFIG.guardRadius,
            Math.min(maxY - CONFIG.guardRadius, pos.y)
          )
        };
        newGuards[dragState.guardIndex].pos = constrainedPos;
      } else {
        // Dragging arrow - rotate guard
        const guard = guards[dragState.guardIndex];
        const angle = Math.atan2(pos.y - guard.pos.y, pos.x - guard.pos.x);
        newGuards[dragState.guardIndex].angle = angle;
      }
      
      setGuards(newGuards);
    } else {
      // Check for hover on body or arrow (only for mouse, not touch)
      if (!('touches' in e)) {
        let foundHoverBody: number | null = null;
        let foundHoverArrow: number | null = null;
        
        guards.forEach((guard, idx) => {
          // Check arrow
          const dirLength = CONFIG.guardRadius * 3.6;
          const arrowX = guard.pos.x + Math.cos(guard.angle) * dirLength;
          const arrowY = guard.pos.y + Math.sin(guard.angle) * dirLength;
          const arrowDist = Math.sqrt(Math.pow(pos.x - arrowX, 2) + Math.pow(pos.y - arrowY, 2));
          
          if (arrowDist < 15) {
            foundHoverArrow = idx;
          }
          
          // Check body
          const bodyDist = Math.sqrt(Math.pow(pos.x - guard.pos.x, 2) + Math.pow(pos.y - guard.pos.y, 2));
          if (bodyDist < CONFIG.guardRadius) {
            foundHoverBody = idx;
          }
        });
        
        setHoveredArrow(foundHoverArrow);
        setHoveredGuard(foundHoverArrow === null ? foundHoverBody : null); // Body only if not hovering arrow
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState !== null) {
      setDragState(null);
      calculateCoverage();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Prevent default scroll behavior on canvas but don't rotate guards
    e.preventDefault();
  };

  // Calculate coverage when guards change
  useEffect(() => {
    calculateCoverage();
  }, [calculateCoverage]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full h-full p-2 sm:p-4 select-none">
      {/* Orientation warning for mobile */}
      {!isLandscape && window.innerWidth < 768 && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4" />
          <span>Rotate your device to landscape for better experience</span>
        </div>
      )}

      <div className="text-center space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Museum Guard</h1>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousLevel}
            disabled={currentLevel === 0}
            className="h-8"
          >
            ←
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm font-semibold">{level.name}</p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                level.difficulty === 'easy' && "bg-green-100 text-green-700",
                level.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                level.difficulty === 'hard' && "bg-red-100 text-red-700"
              )}>
                {level.difficulty.toUpperCase()}
              </span>
              {completedLevels.has(currentLevel) && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Level {currentLevel + 1} of {LEVELS.length} • {level.requiredGuards} guards optimal
              {guardsWatchingArt > 0 && ` • ${guardsWatchingArt} watching art`}
            </p>
            <p className={cn(
              "text-xs font-semibold text-green-600",
              !isComplete && "invisible"
            )}>
              Score: {levelScore} points
            </p>
            {/* Progress indicator for levels 1-3 */}
            <div className="flex items-center justify-center gap-1 mt-1">
              {[0, 1, 2].map(levelIndex => (
                <div
                  key={levelIndex}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    completedLevels.has(levelIndex) ? "bg-green-600" : "bg-gray-300"
                  )}
                  title={`Level ${levelIndex + 1} ${completedLevels.has(levelIndex) ? 'completed' : 'not completed'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                Complete 1-3 to unlock
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextLevel}
            disabled={currentLevel === LEVELS.length - 1}
            className="h-8"
          >
            →
          </Button>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm px-2">
          {level.description}
        </p>
      </div>

      <Card className={cn(
        "relative border-2 transition-colors duration-500 overflow-hidden",
        isComplete ? "border-green-500 bg-green-50" : "border-slate-200"
      )}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CONFIG.canvasWidth}
            height={CONFIG.canvasHeight}
            className="block touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: dragState?.type === 'body' ? 'grabbing' 
                : dragState?.type === 'arrow' ? 'grabbing' 
                : hoveredArrow !== null ? 'grab' 
                : hoveredGuard !== null ? 'move' 
                : 'default',
              width: `${CONFIG.canvasWidth * canvasScale}px`,
              height: `${CONFIG.canvasHeight * canvasScale}px`
            }}
          />

          {/* Coverage Overlay */}
          <div className={cn(
            "absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-semibold pointer-events-none",
            isComplete 
              ? "bg-green-500 text-white shadow-md" 
              : "bg-slate-900/80 text-white shadow-md"
          )} style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}>
            {Math.round(coverage * 100)}% / {Math.round(level.coverageThreshold * 100)}%
            {isComplete && " ✔"}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={removeGuard}
          disabled={guards.length <= 0}
          className="gap-2"
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Remove Guard</span>
          <span className="sm:hidden">Remove</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={addGuard}
          disabled={guards.length >= level.maxGuards}
          className="gap-2"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Guard ({guards.length}/{level.maxGuards})</span>
          <span className="sm:hidden">Add ({guards.length}/{level.maxGuards})</span>
        </Button>

        <Button variant="outline" size="sm" onClick={resetLevel} className="gap-2">
          <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
          Reset
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          className={cn(
            "gap-2 bg-green-600 hover:bg-green-700",
            !isComplete && "invisible"
          )}
          onClick={nextLevel}
          disabled={currentLevel === LEVELS.length - 1}
        >
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
          {currentLevel === LEVELS.length - 1 ? 'Completed!' : 'Next Level'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground max-w-md text-center px-2 space-y-1">
        <p>Solve the classic Art Gallery Problem! Position guards so their vision cones cover {Math.round(level.coverageThreshold * 100)}% of the museum. Drag the guard body to move, drag the arrow handle to rotate.</p>
        <p className="font-semibold">
          Scoring: 5 base points, +2 per guard saved, -2 per extra guard used, +1 per guard watching art
        </p>
      </div>
    </div>
  );
}
