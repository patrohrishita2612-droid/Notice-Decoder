import React, { useEffect, useState } from 'react';

export const ScrollProgressIndicator: React.FC = () => {
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    let animationFrameId: number;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const docElem = document.documentElement;
        const totalHeight = docElem.scrollHeight - docElem.clientHeight;
        if (totalHeight > 0) {
          const currentProgress = (window.scrollY / totalHeight) * 100;
          setScrollPercent(Math.min(100, Math.max(0, Math.round(currentProgress))));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', listener);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <aside 
        aria-label="Scroll Progress"
        className="fixed bottom-4 right-4 z-40 bg-[#172D50] text-[#FEFDE6] px-3 py-1.5 rounded-full text-xs font-mono shadow-md"
      >
        <span>{scrollPercent}% read</span>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Scroll Progress Indicator"
      className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none select-none"
    >
      {/* Live percentage tag */}
      <div className="bg-[#172D50] text-[#F2EE98] px-2 py-1 rounded text-[10px] md:text-xs font-mono font-medium shadow-sm transition-all duration-150 tabular-nums border border-[#FAF8DB]/20">
        {scrollPercent}%
      </div>

      {/* Vertical Track and Live Fill */}
      <div className="w-1.5 md:w-2 h-28 md:h-40 rounded-full bg-[#172D50]/15 relative overflow-hidden backdrop-blur-xs">
        <div 
          className="absolute top-0 left-0 w-full bg-[#E65100] transition-all duration-75 rounded-full"
          style={{ height: `${scrollPercent}%` }}
        />
      </div>

      {/* Subtle indicator dots for major milestones */}
      <div className="flex flex-col gap-1 items-center opacity-60">
        <div className={`w-1 h-1 rounded-full transition-colors ${scrollPercent >= 25 ? 'bg-[#172D50]' : 'bg-[#172D50]/30'}`} />
        <div className={`w-1 h-1 rounded-full transition-colors ${scrollPercent >= 50 ? 'bg-[#172D50]' : 'bg-[#172D50]/30'}`} />
        <div className={`w-1 h-1 rounded-full transition-colors ${scrollPercent >= 75 ? 'bg-[#172D50]' : 'bg-[#172D50]/30'}`} />
      </div>
    </aside>
  );
};
