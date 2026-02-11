export const gameConfig = {
  invisibleHeart: {
    gradingThreshold: 0.7, // Score required to win (0.0 to 1.0)
    dotCount: 3, // Number of guide dots
    minStretch: 0.8, // Minimum stretch factor
    maxStretch: 1.2, // Maximum stretch factor
    strokeWidth: 3, // Width of user drawing
    guideDotSize: 6, // Radius of guide dots
  },
  // Future game configs can go here
  museumGuard: {
    canvasWidth: 800,
    canvasHeight: 600,
    guardRadius: 20,
    guardColor: '#3b82f6', // blue-500
    visionColor: 'rgba(59, 130, 246, 0.15)', // semi-transparent blue
    visionBorderColor: 'rgba(59, 130, 246, 0.4)',
    wallColor: '#1f2937', // gray-800
    floorColor: '#f3f4f6', // gray-100
    artRadius: 15,
    artColor: '#ef4444', // red-500
    minGuards: 1,
    maxGuards: 3,
    rayCount: 360, // number of rays to cast for visibility
    coverageThreshold: 0.85, // 85% of museum must be covered to win
  }
};
