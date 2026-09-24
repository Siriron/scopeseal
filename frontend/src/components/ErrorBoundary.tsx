import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something tore." };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-parchment px-6">
          <div className="max-w-md text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full border-2 border-oxblood flex items-center justify-center">
              <span className="font-mono text-oxblood text-xl">×</span>
            </div>
            <h1 className="font-serif text-2xl text-ink mb-2">The page broke its own seal</h1>
            <p className="font-mono text-sm text-slate mb-6">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono text-sm px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-parchment transition-colors"
            >
              reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
