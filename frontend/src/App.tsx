import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Workspace } from "./components/Workspace";
import { Footer } from "./components/Footer";
import { Docs } from "./components/Docs";
import { NotFound } from "./components/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash.replace("#", "") || "/");
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-parchment seal-texture font-sans text-ink flex flex-col">
        <Header />
        <main className="flex-1">
          {route === "/" && (
            <>
              <Hero />
              <Workspace />
            </>
          )}
          {route === "/docs" && <Docs />}
          {route !== "/" && route !== "/docs" && <NotFound />}
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
