
import { useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useState } from 'react';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

/**
 * STUBBED for contributor rebuild — keep reconnect + dismiss behavior.
 * Rebuild as a dark terminal alert strip (not a crude full-width red bar).
 */
export const OfflineBanner = () => {
  const { isDisconnected, reconnect } = useConnectionStatus();

  if (!isDisconnected) {
    return null;
  }

  return <OfflineAlert reconnect={reconnect} />;
};

function OfflineAlert({ reconnect }: { reconnect: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
  if (!isDisconnected || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-3xl items-center gap-3 overflow-hidden rounded-lg border border-red-400/25 bg-[#0A0F1A]/95 px-4 py-3 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="h-10 w-1 shrink-0 rounded-full bg-red-400" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-red-200">
            Connection lost
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Live updates are paused. Reconnect to resume your session.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={reconnect}
          className="inline-flex items-center gap-2 rounded-md border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-100 transition-colors hover:border-red-300/60 hover:bg-red-400/20 focus:outline-none focus:ring-2 focus:ring-red-300/60"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reconnect
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Dismiss connection alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      className="fixed inset-x-0 top-0 z-50 border-b border-rose-500/40 bg-[#0A0F1A]/95 px-4 py-3 backdrop-blur"
      role="alert"
    >
      <ContributorTaskPlaceholder
        title="Rebuild Offline Banner"
        issueHint="Replace this placeholder with a polished terminal alert: clear offline copy, Reconnect action, and dismiss. Keep reconnect() and dismiss behavior."
      >
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reconnect}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
          >
            Reconnect
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      </ContributorTaskPlaceholder>
    </div>
  );
};
