import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useState } from 'react';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

/**
 * STUBBED for contributor rebuild — keep reconnect + dismiss behavior.
 * Rebuild as a dark terminal alert strip (not a crude full-width red bar).
 */
export const OfflineBanner = () => {
  const { isDisconnected, reconnect } = useConnectionStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!isDisconnected || dismissed) {
    return null;
  }

  return (
    <div
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
