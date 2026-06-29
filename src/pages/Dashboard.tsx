import { useEffect, useState, useRef } from "react";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import PredictionHistory from "../components/PredictionHistory";
import type { PredictionData } from "../components/PredictionControls";
import BetModal from "../components/BetModal";
import EndRoundModal from "../components/EndRoundModal";
import { useRoundStore } from "../store/useRoundStore";
import type { Round } from "../lib/api-client";
import { educationApi } from "../lib/api-client";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { Link } from "react-router-dom";
import { TipCard } from "../components/education/TipCard";
import type { Tip } from "../types/education";
import EmptyState from '../components/EmptyState';
import DashboardSkeleton from '../components/DashboardSkeleton';

const DAILY_TIP_CACHE_KEY = "xelma_daily_tip";

const DailyTip = () => {
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem(DAILY_TIP_CACHE_KEY);

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { date: string; tip: Tip };
        if (parsed.date === today && parsed.tip) {
          setTip(parsed.tip);
          setLoading(false);
          return;
        }
      } catch {
        // corrupted cache — fall through to fetch
      }
    }

    void educationApi.getTip().then((fetched) => {
      if (fetched) {
        localStorage.setItem(
          DAILY_TIP_CACHE_KEY,
          JSON.stringify({ date: today, tip: fetched })
        );
        setTip(fetched);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-2xl glass-card accent-border-teal p-6 animate-pulse"
        aria-busy="true"
        aria-label="Loading daily tip"
      >
        <div className="h-4 w-24 rounded bg-white/10 mb-3" />
        <div className="h-3 w-full rounded bg-white/10 mb-2" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
      </div>
    );
  }

  if (!tip) {
    return null;
  }

  return (
    <div>
      <TipCard tip={tip} />
      <div className="mt-3 text-right">
        <Link
          to="/learn"
          className="text-xs font-semibold text-xelma-teal-bright hover:underline"
        >
          View all guides &rarr;
        </Link>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const isLoading = useRoundStore((state) => state.isLoading);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const isWalletConnecting = useWalletStore(
    (s) => s.status === "connecting" || s.status === "checking"
  );
  const resolvedRound = useRoundStore((state) => state.resolvedRound);
  const dismissResolvedRound = useRoundStore((state) => state.dismissResolvedRound);
  const publicKey = useWalletStore((s) => s.publicKey);
  const balance = useWalletStore((s) => s.balance);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const { fetchActiveRound, subscribeToRoundEvents } = useRoundStore.getState();
    void fetchActiveRound();
    const unsubscribe = subscribeToRoundEvents();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentTimeout = timeoutRef.current;
    return () => {
      if (currentTimeout !== null) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const handlePrediction = (data: PredictionData) => {
    setPendingPrediction(data);
    setIsBetModalOpen(true);
  };

  const getEndRoundResult = (round: Round | null) => {
    const defaultTip = 'Stay tuned for the next round.';

    if (!round) {
      return {
        isWin: false,
        amount: 0,
        tip: defaultTip,
      };
    }

    const isWin = typeof round.isWin === 'boolean'
      ? round.isWin
      : String(round.outcome ?? round.result ?? '').toLowerCase() === 'win';

    const amount = typeof round.netChange === 'number'
      ? round.netChange
      : typeof round.profit === 'number'
      ? round.profit
      : typeof round.score === 'number'
      ? round.score
      : 0;

    const tip = typeof round.tip === 'string'
      ? round.tip
      : typeof round.note === 'string'
      ? round.note
      : defaultTip;

    return { isWin, amount, tip };
  };

  const endRoundResult = getEndRoundResult(resolvedRound);

  return (
    <div className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {isLoading && <DashboardSkeleton />}

        {!isLoading && !isWalletConnected && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 p-4 text-sm text-[#BEC7FE] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
            <p className="leading-relaxed" data-testid="dashboard-wallet-prompt">
              Connect your wallet to submit predictions.
            </p>
            <Link
              to="/connect"
              data-testid="dashboard-connect-now"
              className="btn-primary no-underline inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 py-2 text-sm font-bold sm:w-auto"
            >
              Connect now
            </Link>
          </div>
        )}

        {!isLoading && !isRoundActive && (
          <EmptyState
            title="No Active Rounds"
            description="Learn how the game works or refresh to check for new rounds."
            action={
              <button
                type="button"
                className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  void useRoundStore.getState().fetchActiveRound();
                }}
              >
                Refresh
              </button>
            }
          />
        )}

        {!isLoading && isRoundActive && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
              <PredictionCard
                isWalletConnected={isWalletConnected}
                isRoundActive={isRoundActive}
                isConnecting={isWalletConnecting}
                isSubmittingPrediction={isBetModalOpen}
                onPrediction={handlePrediction}
                walletBalance={balance}
              />
              <DailyTip />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
                <PriceChart height={280} />
              </div>
              <PredictionHistory userId={publicKey} />
            </div>
          </div>
        )}
      </div>

      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setPendingPrediction(null);
        }}
        predictionData={pendingPrediction}
        onSuccess={(txHash: string) => {
          console.log("Prediction confirmed on-chain. TxHash:", txHash);
        }}
      />
      <EndRoundModal
        isOpen={Boolean(resolvedRound)}
        onClose={dismissResolvedRound}
        result={endRoundResult}
      />
    </div>
  );
};

export default Dashboard;
