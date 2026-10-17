import React, { useRef } from 'react';
import { useParticleSystem, ParticleMode, ParticleOptions } from '../hooks/useParticleSystem';
import './ParticlePreloader.css';

export interface ParticlePreloaderProps {
  mode?: ParticleMode;
  statusLabel?: string;
  sublabel?: string;
  progressPct?: number; // only display numerical percentage if explicitly known/provided
  options?: ParticleOptions;
  height?: number | string;
  className?: string;
  isError?: boolean;
  onRetry?: () => void;
}

export const ParticlePreloader: React.FC<ParticlePreloaderProps> = ({
  mode = 'idle',
  statusLabel = 'Processing document...',
  sublabel,
  progressPct,
  options,
  height = 220,
  className = '',
  isError = false,
  onRetry
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectiveMode: ParticleMode = isError ? 'error' : mode;

  const { isReducedMotion } = useParticleSystem(canvasRef, effectiveMode, options);

  return (
    <div 
      className={`particle-preloader-container rounded-2xl bg-[#FAF8DB]/60 border border-[#E8E5BA] p-4 transition-all ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      role="status"
      aria-live="polite"
    >
      {/* Interactive Particle Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden" style={{ minHeight: 140 }}>
        <canvas
          ref={canvasRef}
          className="particle-canvas"
          style={{ minHeight: '140px', width: '100%', height: '100%' }}
          aria-label={isReducedMotion ? 'Static visual indicator' : 'Interactive particle preloader: move cursor or click to interact'}
        />

        {/* Ambient Center Glow */}
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-32 h-32 rounded-full bg-[#79C8D0]/10 blur-xl" />
        </div>
      </div>

      {/* Status Label & Measurable Progress (if present) */}
      <div className="w-full mt-3 pt-3 border-t border-[#E8E5BA]/60 flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs font-mono text-[#172B4D]">
        <div className="flex items-center gap-2 truncate">
          <span 
            className={`w-2 h-2 rounded-full shrink-0 ${
              isError 
                ? 'bg-[#D9574F]' 
                : 'bg-[#D9A928] particle-status-pulse'
            }`}
            aria-hidden="true" 
          />
          <div className="truncate text-left">
            <span className={`font-semibold ${isError ? 'text-[#D9574F]' : 'text-[#172B4D]'}`}>
              {statusLabel}
            </span>
            {sublabel && (
              <span className="text-[11px] text-[#172B4D]/60 ml-2 hidden sm:inline">
                {sublabel}
              </span>
            )}
          </div>
        </div>

        {/* Show numerical percentage only if explicitly measurable */}
        {typeof progressPct === 'number' && !isError && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#172B4D]/80">
              {Math.round(progressPct)}%
            </span>
            <div className="w-16 h-1.5 bg-[#E8E5BA] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D9A928] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>
        )}

        {/* If indeterminate, show quiet ambient indicator */}
        {typeof progressPct !== 'number' && !isError && (
          <span className="text-[10px] text-[#172B4D]/40 font-mono tracking-wider uppercase shrink-0">
            Active
          </span>
        )}

        {/* Error Retry Button */}
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded bg-[#D9574F] text-[#FFFDF7] hover:bg-[#B8423B] transition-colors text-xs font-mono font-medium cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
