import { Home, Moon, Sun, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type ApiStatus = 'loading' | 'connected' | 'disconnected';

interface ApiKeyStatus {
  connected: boolean;
  provider: string;
  model: string;
  error?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export function TopBar() {
  const [dark, setDark] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading');
  const [apiDetails, setApiDetails] = useState<ApiKeyStatus | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dux-theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  useEffect(() => {
    setApiStatus('loading');
    fetch('/api/health/api-key')
      .then(r => r.json())
      .then((data: ApiKeyStatus) => {
        setApiDetails(data);
        setApiStatus(data.connected ? 'connected' : 'disconnected');
      })
      .catch(() => setApiStatus('disconnected'));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('dux-theme', next ? 'dark' : 'light');
  };

  const dotColor =
    apiStatus === 'loading' ? 'bg-yellow-400' :
    apiStatus === 'connected' ? 'bg-green-500' :
    'bg-red-500';

  const tooltipText =
    apiStatus === 'loading' ? 'Checking API connection…' :
    apiStatus === 'connected'
      ? `Connected · ${apiDetails?.provider} · ${apiDetails?.model}`
      : `Disconnected · ${apiDetails?.error ?? 'Unknown error'}`;

  const providerLabel = apiDetails?.provider ? (PROVIDER_LABELS[apiDetails.provider] ?? apiDetails.provider) : null;
  const statusLabel = apiStatus === 'loading' ? 'Connecting…' : (providerLabel ?? 'No key');

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">DUX</span>
        </Link>
        <span className="text-muted-foreground/30 text-xs select-none">|</span>
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* API connection status */}
        <div className="group relative flex items-center gap-2" title={tooltipText}>
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${dotColor} ${apiStatus === 'loading' ? 'animate-pulse' : ''}`}
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">{statusLabel}</span>

          {/* Hover tooltip */}
          <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-20 pointer-events-none">
            <div className="rounded-md bg-popover border text-popover-foreground text-xs px-2.5 py-1.5 shadow-md whitespace-nowrap">
              {tooltipText}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
