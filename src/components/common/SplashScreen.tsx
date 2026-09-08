import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export function SplashScreen({ onFinish, minDurationMs = 800 }: SplashScreenProps) {
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Check if splash already shown this session
    const shown = sessionStorage.getItem('mills_splash_shown');
    if (shown) {
      setIsDone(true);
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      sessionStorage.setItem('mills_splash_shown', 'true');
      setTimeout(() => {
        setIsDone(true);
        onFinish?.();
      }, 350);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  if (isDone) return null;

  return (
    <div
      onClick={() => {
        setIsFading(true);
        sessionStorage.setItem('mills_splash_shown', 'true');
        setTimeout(() => {
          setIsDone(true);
          onFinish?.();
        }, 200);
      }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#25150A] text-[#FAF7F2] transition-opacity duration-300 select-none cursor-pointer",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      {/* Embossed Physical Board Logo */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#4A321E] to-[#1A0E06] p-2.5 shadow-2xl border-2 border-[#5C4028] flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#D4AF37] fill-none stroke-[3]">
            <rect x="15" y="15" width="70" height="70" rx="4" />
            <rect x="32" y="32" width="36" height="36" rx="2" />
            <line x1="50" y1="15" x2="50" y2="32" />
            <line x1="50" y1="68" x2="50" y2="85" />
            <line x1="15" y1="50" x2="32" y2="50" />
            <line x1="68" y1="50" x2="85" y2="50" />
            <circle cx="50" cy="15" r="4" fill="#FAF7F2" stroke="#25150A" strokeWidth="1.5" />
            <circle cx="85" cy="50" r="4" fill="#25150A" stroke="#D4AF37" strokeWidth="1.5" />
            <circle cx="50" cy="85" r="4" fill="#FAF7F2" stroke="#25150A" strokeWidth="1.5" />
            <circle cx="15" cy="50" r="4" fill="#25150A" stroke="#D4AF37" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <h1 className="text-3xl font-black tracking-widest text-[#FAF7F2] font-mono">
        MILLS
      </h1>
      <span className="text-xs tracking-[0.3em] uppercase text-[#C4973B] font-bold mt-1">
        ARENA
      </span>

      <div className="mt-8 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C4973B] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#C4973B] animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#C4973B] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
