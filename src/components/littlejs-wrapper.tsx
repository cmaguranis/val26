import { useEffect, useRef } from 'react';
import * as LJS from 'littlejsengine';

// Singleton state to manage the LittleJS engine instance across React mounts
let isEngineInitialized = false;
let currentUpdate: (() => void) | null = null;
let currentRender: (() => void) | null = null;
let currentUpdatePost: (() => void) | null = null;
let currentRenderPost: (() => void) | null = null;

// Proxy functions that delegate to the current component's callbacks
const proxyUpdate = () => currentUpdate?.();
const proxyRender = () => currentRender?.();
const proxyUpdatePost = () => currentUpdatePost?.();
const proxyRenderPost = () => currentRenderPost?.();
// We handle game-specific init manually in the component
const proxyInit = async () => {}; 

interface LittleJSWrapperProps {
  gameInit?: () => void;
  gameUpdate?: () => void;
  gameRender?: () => void;
  gameUpdatePost?: () => void;
  gameRenderPost?: () => void;
  imageSources?: string[];
  className?: string;
}

export function LittleJSWrapper({
  gameInit,
  gameUpdate,
  gameRender,
  gameUpdatePost,
  gameRenderPost,
  imageSources = [],
  className = "",
}: LittleJSWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Update callbacks whenever props change
  useEffect(() => {
    currentUpdate = gameUpdate || null;
    currentRender = gameRender || null;
    currentUpdatePost = gameUpdatePost || null;
    currentRenderPost = gameRenderPost || null;
  }, [gameUpdate, gameRender, gameUpdatePost, gameRenderPost]);

  // One-time initialization of the engine
  useEffect(() => {
    const setup = async () => {
      if (!isEngineInitialized) {
        isEngineInitialized = true;
        
        // specific settings for LittleJS to play nice with React/UI
        // We pass a detached element initially so it doesn't mess up the document body styles
        const initialRoot = document.createElement('div');
        
        try {
          // Initialize with proxies that delegate to the global current* variables
          await LJS.engineInit(
            proxyInit,
            proxyUpdate,
            proxyUpdatePost,
            proxyRender,
            proxyRenderPost,
            imageSources,
            initialRoot
          );
        } catch (e) {
          console.error("Failed to initialize LittleJS", e);
        }
      } else {
        // If engine is already running, we might need to load new assets
        // For now, we assume assets are managed or this simple check is enough
        // Ideally we would check LJS.textureInfos and load missing ones
      }

      // Move the canvas to our React container
      if (containerRef.current && LJS.mainCanvas) {
        // Clear container first just in case
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(LJS.mainCanvas);
        
        // Reset canvas styles to fit our container if needed
        // LittleJS sets fixed positioning, we might want to override
        LJS.mainCanvas.style.position = 'absolute';
        LJS.mainCanvas.style.top = '50%';
        LJS.mainCanvas.style.left = '50%';
        LJS.mainCanvas.style.transform = 'translate(-50%, -50%)';
        
        // Trigger a resize to fit the new container
        window.dispatchEvent(new Event('resize'));
      }

      // Run the specific game initialization
      gameInit?.();
      
      // Resume engine
      LJS.setPaused(false);
    };

    setup();

    return () => {
      // Pause engine when component unmounts
      LJS.setPaused(true);
      
      // Clear callbacks to avoid running logic for unmounted component
      currentUpdate = null;
      currentRender = null;
      currentUpdatePost = null;
      currentRenderPost = null;
    };
    // Re-run setup if imageSources changes (though simple re-init isn't supported by engine, we do best effort)
    // In practice, imageSources should be constant for the game instance
  }, [gameInit, imageSources]);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden bg-black ${className}`}
      // Prevent default touch actions to allow game input
      style={{ touchAction: 'none' }}
    />
  );
}
