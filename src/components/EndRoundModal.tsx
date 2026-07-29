import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    isWin?: boolean;
    amount?: number;
    tip?: string;
    asset?: string;
    direction?: 'UP' | 'DOWN' | string;
  };
}

export default function EndRoundModal({ isOpen, onClose, result }: EndRoundModalProps) {
  const {
    isWin = false,
    amount = 0,
    tip = 'Stay tuned for the next round.',
    asset = 'BTC',
    direction = 'UP',
  } = result ?? {};
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // 1. Draw sleek gradient background
      const grad = ctx.createRadialGradient(600, 315, 100, 600, 315, 700);
      grad.addColorStop(0, '#1e293b'); // light slate
      grad.addColorStop(1, '#0f172a'); // dark slate
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // 2. Draw subtle grid background/dots for tech aesthetic
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 30; x < 1200; x += 40) {
        for (let y = 30; y < 630; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Draw premium border
      ctx.strokeStyle = isWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)';
      ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, 1184, 614);

      // 4. Logo / Brand Watermark
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
      ctx.fillText('✦ XELMA', 80, 80);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 20px "Outfit", "Inter", sans-serif';
      ctx.fillText('Trustless Prediction Markets', 270, 78);

      // 5. Result Banner Title
      ctx.fillStyle = isWin ? '#10b981' : '#f43f5e';
      ctx.font = 'bold 30px "Outfit", "Inter", sans-serif';
      ctx.fillText('ROUND COMPLETED', 80, 180);

      // 6. Huge PnL Display
      const pnlText = `${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
      ctx.fillStyle = isWin ? '#34d399' : '#fb7185';
      ctx.font = '900 120px "Outfit", "Inter", sans-serif';
      ctx.fillText(pnlText, 80, 310);

      // 7. Stat blocks details (Asset & Direction)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      
      const drawBlock = (bx: number, by: number, bw: number, bh: number, br: number) => {
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(bx, by, bw, bh, br);
        } else {
          ctx.rect(bx, by, bw, bh);
        }
        ctx.fill();
        ctx.stroke();
      };

      // Draw Asset block
      drawBlock(80, 380, 320, 140, 16);
      // Draw Direction block
      drawBlock(440, 380, 320, 140, 16);
      // Draw Watermark block on right
      drawBlock(800, 380, 320, 140, 16);

      // Text in Asset block
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
      ctx.fillText('ASSET PAIR', 110, 420);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
      ctx.fillText(`${asset}/USD`, 110, 475);

      // Text in Direction block
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
      ctx.fillText('YOUR PREDICTION', 470, 420);
      ctx.fillStyle = direction.toUpperCase() === 'UP' ? '#34d399' : '#fb7185';
      ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
      ctx.fillText(direction.toUpperCase() === 'UP' ? '📈 UP' : '📉 DOWN', 470, 475);

      // Text in Watermark block
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px "Outfit", "Inter", sans-serif';
      ctx.fillText('PLATFORM', 830, 420);
      ctx.fillStyle = '#38bdf8'; // light blue / cyan
      ctx.font = 'bold 32px "Outfit", "Inter", sans-serif';
      ctx.fillText('xelma.network', 830, 475);

      // 8. Footer Watermark at the bottom center
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '500 18px "Outfit", "Inter", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Decentralized & Secure on Stellar Soroban', 1120, 560);

      // Convert to blob and share/download
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Canvas conversion failed');
        }

        const file = new File([blob], `xelma-round-${asset}-${Date.now()}.png`, { type: 'image/png' });

        // Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Xelma Round Result',
              text: `I just made ${isWin ? 'a profit of +' : 'a prediction of -'}$${Math.abs(amount).toFixed(2)} on ${asset} on Xelma!`,
            });
            setIsSharing(false);
            return;
          } catch (shareErr) {
            console.warn('Web Share failed, falling back to download:', shareErr);
          }
        }

        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xelma-round-${asset}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error('Error generating share card:', err);
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      return;
    }

    const previouslyFocused = previouslyFocusedRef.current;
    if (previouslyFocused?.isConnected) {
      window.setTimeout(() => previouslyFocused.focus(), 0);
    }
  }, [isOpen]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 bg-black/90 backdrop-blur-md z-40 ${MODAL_OVERLAY}`} />

        <Dialog.Content
          aria-label={isWin ? 'Spectacular Win!' : 'Tough Break'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          <div className={`w-full max-w-md ${MODAL_CONTENT}`}>
            <div className={`relative overflow-hidden rounded-2xl border ${
              isWin ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <div className={`absolute top-0 inset-x-0 h-32 ${
                isWin ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              </div>

              <div className="relative pt-12 px-8 pb-8 text-center">
                <div
                  className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 border-4 border-white ${
                    isWin ? 'bg-emerald-400 text-white' : 'bg-rose-400 text-white'
                  }`}
                  aria-hidden
                >
                  {isWin ? '📈' : '📉'}
                </div>

                <Dialog.Title className={`text-3xl font-black  mb-2 tracking-tight ${
                  isWin ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {isWin ? 'Spectacular Win!' : 'Tough Break'}
                </Dialog.Title>
                
                <Dialog.Description className={`text-lg font-medium mb-8 ${
                  isWin ? 'text-emerald-800 dark:text-emerald-900' : 'text-rose-800 dark:text-rose-900'
                }`}>
                  {isWin ? 'You made all the right moves.' : 'The market moved against you.'}
                </Dialog.Description>

                <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">
                    Net Result
                  </p>
                  <div className={`text-5xl font-black tabular-nums tracking-tighter ${
                    isWin ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isWin ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                  </div>
                </div>

                <div className={`rounded-lg p-5 mb-8 text-left border ${
                  isWin 
                    ? 'bg-emerald-100/50 border-emerald-200' 
                    : 'bg-rose-100/50 border-rose-200'
                }`}>
                  <div className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isWin ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                      }`}
                      aria-hidden
                    >
                      💡
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm mb-1 ${
                        isWin ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        Analyst's Note
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        isWin ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {tip}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSharing}
                  className={`w-full py-4 mb-3 rounded-xl font-bold text-lg active:scale-95 transition-all outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 border flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isWin
                      ? 'border-emerald-200 bg-white hover:bg-emerald-100/50 text-emerald-800 focus-visible:ring-emerald-300 focus-visible:ring-offset-emerald-50'
                      : 'border-rose-200 bg-white hover:bg-rose-100/50 text-rose-800 focus-visible:ring-rose-300 focus-visible:ring-offset-rose-50'
                  }`}
                >
                  {isSharing ? (
                    <>
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                      Generating Card...
                    </>
                  ) : (
                    <>
                      <span>Share Result</span>
                      <span aria-hidden>🔗</span>
                    </>
                  )}
                </button>

                <Dialog.Close asChild>
                  <button
                    ref={continueButtonRef}
                    type="button"
                    className={`w-full py-4 rounded-xl font-bold text-lg active:scale-95 transition-all outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                      isWin
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-300 focus-visible:ring-offset-emerald-50'
                        : 'bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-300 focus-visible:ring-offset-rose-50'
                    }`}
                  >
                    Continue to Next Round
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
