import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LandingPage } from "@/components/landing-page";
import { GameLayout } from "@/components/game-layout";
import { PasswordPrompt } from "@/components/password-prompt";
import { LoveCounter } from "@/components/love-counter";
import { LoadingSquare } from "@/components/loading-square";
import { GAME_INDEX_PATH } from "@/hooks/use-game-index";

// Lazy load game components (they contain heavy Three.js dependencies)
const InvisibleHeart = lazy(() => import("@/games/invisible-heart"));
const UnwrappedUV = lazy(() => import("@/games/unwrapped-uv"));
const MuseumGuard = lazy(() => import("@/games/museum-guard"));
const GameIndex = lazy(() => import("@/games/game-index"));

// Wrapper component for PasswordPrompt to handle navigation
function PasswordPromptPage() {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    navigate('/love-counter');
  };

  return <PasswordPrompt onSuccess={handleSuccess} />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Password prompt and love counter routes */}
        <Route path="/password-prompt" element={<PasswordPromptPage />} />
        <Route path="/love-counter" element={<LoveCounter />} />

        {/* Secret Game Index Route with lazy loading */}
        <Route path={GAME_INDEX_PATH} element={<GameLayout />}>
          <Route index element={
            <Suspense fallback={<LoadingSquare />}>
              <GameIndex />
            </Suspense>
          } />
          <Route path="invisible-heart" element={
            <Suspense fallback={<LoadingSquare />}>
              <InvisibleHeart />
            </Suspense>
          } />
          <Route path="unwrapped-uv" element={
            <Suspense fallback={<LoadingSquare />}>
              <UnwrappedUV />
            </Suspense>
          } />
          <Route path="museum-guard" element={
            <Suspense fallback={<LoadingSquare />}>
              <MuseumGuard />
            </Suspense>
          } />
        </Route>

        {/* 404 - Redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;