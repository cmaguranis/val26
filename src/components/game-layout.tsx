import { useGameIndex } from "@/hooks/use-game-index";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function GameLayout() {
  const { indexPath } = useGameIndex();
  const location = useLocation();
  const isIndex = location.pathname === indexPath;

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          {!isIndex ? (
            <Button variant="ghost" asChild className="-ml-4 gap-2">
              <Link to={indexPath}>
                <ArrowLeft className="h-4 w-4" />
                Back to Arcade
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild className="-ml-4 gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          )}
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}
