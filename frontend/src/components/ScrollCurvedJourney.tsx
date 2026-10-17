import React, { useEffect, useRef, useState } from 'react';
import { FileText, Cpu, CalendarCheck } from 'lucide-react';

export const ScrollCurvedJourney: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [strokeProgress, setStrokeProgress] = useState<number>(0);
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
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate progress as user scrolls down the section
        const totalScrollable = rect.height - windowHeight * 0.3;
        const currentScrolled = windowHeight * 0.6 - rect.top;
        const progress = Math.max(0, Math.min(1, currentScrolled / totalScrollable));

        setStrokeProgress(progress);
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

  const effectiveProgress = prefersReducedMotion ? 1 : strokeProgress;

  return (
    <section 
      ref={sectionRef} 
      className="relative min-h-[160vh] py-24 md:py-32 px-6 md:px-12 bg-[#F7F4E9]/50 overflow-hidden border-t border-[#E2DDD0]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFDF7] border border-[#E2DDD0] text-xs font-mono tracking-wider text-[#172B4D]/80 uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-[#D9A928]"></span>
            Product Architecture
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-[#172B4D]">
            The Journey from Circular to Calendar
          </h2>
          <p className="mt-4 text-[#172B4D]/75 max-w-xl mx-auto text-base md:text-lg">
            A continuous, source-grounded workflow connecting raw institutional text to synchronized student schedules.
          </p>
        </div>

        {/* Scroll-guided Interactive Canvas with SVG curved stroke */}
        <div className="relative py-12">
          {/* Curved SVG Line spanning the path */}
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 800 900" 
              fill="none" 
              preserveAspectRatio="none"
            >
              {/* Background faint guide track */}
              <path
                d="M 150 100 C 150 250, 650 250, 650 450 C 650 650, 200 650, 200 820"
                stroke="#E2DDD0"
                strokeWidth="3"
                strokeDasharray="6 6"
                fill="none"
              />
              {/* Active progressive stroke */}
              <path
                d="M 150 100 C 150 250, 650 250, 650 450 C 650 650, 200 650, 200 820"
                stroke="#172B4D"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - effectiveProgress}
                className="transition-all duration-75"
              />
            </svg>
          </div>

          {/* 3 Step Cards positioned along the journey */}
          <div className="space-y-24 md:space-y-36 relative z-10">
            {/* Step 1: Notice */}
            <div className={`transition-all duration-500 transform ${
              effectiveProgress >= 0.15 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'
            } max-w-md md:ml-12`}>
              <div className="bg-[#FFFDF7] p-6 md:p-8 rounded-xl border border-[#E2DDD0] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#172B4D] text-[#D9A928] flex items-center justify-center font-mono font-semibold text-sm">
                    01
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#172B4D]/60 block">Step One</span>
                    <h3 className="font-serif text-xl font-semibold text-[#172B4D] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D9A928]" />
                      Complex Notice
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#172B4D]/80 leading-relaxed">
                  Pasted raw circulars, PDFs, or scanned announcement boards. Dates, venues, eligibility, and instructions are extracted using OCR and structured parsing.
                </p>
                <div className="mt-4 pt-3 border-t border-[#E2DDD0]/80 flex items-center gap-2 text-xs font-mono text-[#172B4D]/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#172B4D]"></span>
                  Input validation & text extraction
                </div>
              </div>
            </div>

            {/* Step 2: Understanding */}
            <div className={`transition-all duration-500 transform ${
              effectiveProgress >= 0.45 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'
            } max-w-md md:ml-auto md:mr-12`}>
              <div className="bg-[#FFFDF7] p-6 md:p-8 rounded-xl border border-[#E2DDD0] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#172B4D] text-[#A8B8A0] flex items-center justify-center font-mono font-semibold text-sm">
                    02
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#172B4D]/70 block">Step Two</span>
                    <h3 className="font-serif text-xl font-semibold text-[#172B4D] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#A8B8A0]" />
                      Explainable Summary
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#172B4D]/80 leading-relaxed">
                  Plain-language takeaways with verified dates, start/end times, and submission deadlines. Any uncertain or ambiguous details are visibly flagged for human review.
                </p>
                <div className="mt-4 pt-3 border-t border-[#E2DDD0]/80 flex items-center gap-2 text-xs font-mono text-[#D9A928]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A928]"></span>
                  Uncertainty flags (Room changes, calculators)
                </div>
              </div>
            </div>

            {/* Step 3: Action */}
            <div className={`transition-all duration-500 transform ${
              effectiveProgress >= 0.75 ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4'
            } max-w-md md:ml-20`}>
              <div className="bg-[#FFFDF7] p-6 md:p-8 rounded-xl border border-[#E2DDD0] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#172B4D] text-[#D9A928] flex items-center justify-center font-mono font-semibold text-sm">
                    03
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#172B4D]/70 block">Step Three</span>
                    <h3 className="font-serif text-xl font-semibold text-[#172B4D] flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-[#D9A928]" />
                      Timetable & Action
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#172B4D]/80 leading-relaxed">
                  Full-duration conflict detection cross-referencing your course lectures. Alternative slots recommended with reasons, and 1-click sync to your digital calendar.
                </p>
                <div className="mt-4 pt-3 border-t border-[#E2DDD0]/80 flex items-center gap-2 text-xs font-mono text-[#172B4D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#172B4D]"></span>
                  Export .ics & conflict-free scheduling
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
