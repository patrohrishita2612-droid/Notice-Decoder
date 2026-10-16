import React, { useEffect, useRef, useState } from 'react';

interface WordConfig {
  text: string;
  isAccent?: boolean;
  hasBackground?: boolean;
  lineBreak?: boolean;
}

const SENTENCE_WORDS: WordConfig[] = [
  // Sentence 1
  { text: 'Important', isAccent: true, hasBackground: true },
  { text: 'dates', isAccent: true, hasBackground: true },
  { text: 'get' },
  { text: 'buried.' },
  { text: '', lineBreak: true },
  // Sentence 2
  { text: 'Deadlines', isAccent: true, hasBackground: true },
  { text: 'are' },
  { text: 'easy' },
  { text: 'to' },
  { text: 'miss.' },
  { text: '', lineBreak: true },
  // Sentence 3
  { text: 'Timetables', isAccent: true, hasBackground: true },
  { text: 'become' },
  { text: 'difficult' },
  { text: 'to' },
  { text: 'coordinate.' },
  { text: '', lineBreak: true },
  // Sentence 4
  { text: 'Understanding' },
  { text: 'a' },
  { text: 'notice' },
  { text: 'should' },
  { text: 'not' },
  { text: 'take' },
  { text: 'more' },
  { text: 'effort' },
  { text: 'than' },
  { text: 'acting', isAccent: true, hasBackground: true },
  { text: 'on', isAccent: true, hasBackground: true },
  { text: 'it.', isAccent: true, hasBackground: true },
];

export const ScrollWordReveal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionListener);

    let rafId: number;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Container scroll bounds: start revealing when top hits 60% of viewport,
        // and finish when bottom is still visible
        const totalDistance = rect.height - windowHeight * 0.4;
        const scrolledPast = (windowHeight * 0.7) - rect.top;
        const progress = Math.max(0, Math.min(1, scrolledPast / totalDistance));

        // Compute total active words count
        const totalWords = SENTENCE_WORDS.filter(w => !w.lineBreak).length;
        const currentActive = Math.round(progress * totalWords);
        setActiveWordIndex(currentActive);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      mediaQuery.removeEventListener('change', motionListener);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[140vh] py-24 md:py-32 px-6 md:px-12 flex flex-col justify-start items-center bg-[#FEFDE6] border-y border-[#E8E5BA]/60"
    >
      <div className="sticky top-28 md:top-36 max-w-4xl mx-auto text-center">
        {/* Subtle Section Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8DB] border border-[#E8E5BA] text-xs font-mono tracking-wider text-[#172D50]/80 uppercase mb-8">
          <span className="w-2 h-2 rounded-full bg-[#E65100]"></span>
          The Academic Notice Problem
        </div>

        {/* Word by word animated text */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[1.3] md:leading-[1.35] text-[#172D50]">
          {(() => {
            let wordCounter = 0;
            return SENTENCE_WORDS.map((item, idx) => {
              if (item.lineBreak) {
                return <span key={`break-${idx}`} className="block h-2 md:h-4" />;
              }

              const currentWordNum = ++wordCounter;
              const isRevealed = prefersReducedMotion || currentWordNum <= activeWordIndex;

              return (
                <span
                  key={`word-${idx}`}
                  className={`inline-block mr-[0.28em] transition-all duration-300 transform ${
                    isRevealed
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-20 translate-y-2 select-none'
                  }`}
                >
                  <span
                    className={`inline-block px-1 rounded transition-colors duration-200 ${
                      item.hasBackground && isRevealed
                        ? 'bg-[#F2EE98]/60 text-[#172D50]'
                        : ''
                    } ${
                      item.isAccent && isRevealed
                        ? 'text-[#E65100] font-semibold'
                        : ''
                    }`}
                  >
                    {item.text}
                  </span>
                </span>
              );
            });
          })()}
        </h2>

        {/* Supporting subtext indicator */}
        <div className="mt-12 text-sm text-[#172D50]/60 font-mono flex items-center justify-center gap-2">
          <span>↓ Scroll to reveal journey</span>
        </div>
      </div>
    </section>
  );
};
